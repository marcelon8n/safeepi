import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresaId } from "@/hooks/useEmpresaId";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

/* ── masks ── */
const maskCpfCnpj = (v: string) => {
  const d = v.replace(/\D/g, "");
  if (d.length <= 11)
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2}\.\d{3})(\d)/, "$1.$2")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .slice(0, 18);
};

const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
};

const maskCep = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.replace(/(\d{5})(\d)/, "$1-$2");
};

/* ── schema ── */
const checkoutSchema = z.object({
  razaoSocial: z.string().trim().min(2, "Informe a razão social").max(200),
  cpfCnpj: z.string().trim().min(14, "CPF ou CNPJ inválido").max(18),
  emailFaturamento: z.string().trim().email("E-mail inválido").max(255),
  celular: z.string().trim().min(14, "Celular inválido").max(15),
  cep: z.string().trim().min(9, "CEP inválido").max(9),
  logradouro: z.string().trim().min(2, "Informe o logradouro").max(200),
  numero: z.string().trim().min(1, "Informe o número").max(10),
  bairro: z.string().trim().min(2, "Informe o bairro").max(100),
  complemento: z.string().trim().max(100).optional().or(z.literal("")),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

interface PlanInfo {
  name: string;
  price: string;
}

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: PlanInfo | null;
}

const CheckoutDialog = ({ open, onOpenChange, plan }: CheckoutDialogProps) => {
  const { user } = useAuth();
  const { empresaId } = useEmpresaId();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [fetchingCep, setFetchingCep] = useState(false);

  const { data: empresa } = useQuery({
    queryKey: ["empresa-checkout", empresaId],
    queryFn: async () => {
      if (!empresaId) return null;
      const { data } = await supabase.from("empresas").select("nome_fantasia, cnpj").eq("id", empresaId).maybeSingle();
      return data;
    },
    enabled: !!empresaId && open,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      razaoSocial: "",
      cpfCnpj: "",
      emailFaturamento: "",
      celular: "",
      cep: "",
      logradouro: "",
      numero: "",
      bairro: "",
      complemento: "",
    },
  });

  /* auto-fill empresa */
  useEffect(() => {
    if (empresa) {
      setValue("razaoSocial", empresa.nome_fantasia ?? "");
      setValue("cpfCnpj", maskCpfCnpj(empresa.cnpj ?? ""));
    }
    if (user?.email) {
      setValue("emailFaturamento", user.email);
    }
  }, [empresa, user, setValue]);

  /* reset on close */
  useEffect(() => {
    if (!open) {
      reset();
      setSubmitting(false);
    }
  }, [open, reset]);

  /* ViaCEP lookup */
  const lookupCep = useCallback(
    async (cepRaw: string) => {
      const digits = cepRaw.replace(/\D/g, "");
      if (digits.length !== 8) return;
      setFetchingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setValue("logradouro", data.logradouro ?? "", { shouldValidate: true });
          setValue("bairro", data.bairro ?? "", { shouldValidate: true });
        }
      } catch {
        /* silently ignore – user can fill manually */
      } finally {
        setFetchingCep(false);
      }
    },
    [setValue],
  );

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCep(e.target.value);
    setValue("cep", masked, { shouldValidate: true });
    if (masked.replace(/\D/g, "").length === 8) {
      lookupCep(masked);
    }
  };

  const onSubmit = async (values: CheckoutFormValues) => {
    setSubmitting(true);
    try {
      const body = {
        nome: values.razaoSocial,
        cpfCnpj: values.cpfCnpj.replace(/\D/g, ""),
        email: values.emailFaturamento,
        celular: values.celular.replace(/\D/g, ""),
        cep: values.cep.replace(/\D/g, ""),
        logradouro: values.logradouro,
        numero: values.numero,
        bairro: values.bairro,
        complemento: values.complemento ?? "",
        planoNome: plan?.name,
        valor: plan?.price,
        empresaId: empresaId,
      };

      const response = await fetch("https://api.safesolutions.app/webhook/checkout-safeepi", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}: O servidor recusou a conexão.`);
      }

      const data = await response.json();

      if (data && (data.url || data.invoiceUrl)) {
        window.location.href = data.url || data.invoiceUrl;
      } else {
        toast({ title: "Erro", description: "Não foi possível gerar o link de pagamento.", variant: "destructive" });
        setSubmitting(false);
      }
    } catch (err: any) {
      toast({
        title: "Erro ao processar checkout",
        description: err.message || "Falha desconhecida. Tente novamente.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  if (!plan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary">Checkout</DialogTitle>
          <DialogDescription>
            Assinatura do <span className="font-semibold">{plan.name}</span> — R$ {plan.price}/mês
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Razão Social */}
          <div className="space-y-1.5">
            <Label htmlFor="razaoSocial">Razão Social / Nome Completo</Label>
            <Input id="razaoSocial" {...register("razaoSocial")} />
            {errors.razaoSocial && <p className="text-xs text-destructive">{errors.razaoSocial.message}</p>}
          </div>

          {/* CPF/CNPJ */}
          <div className="space-y-1.5">
            <Label htmlFor="cpfCnpj">CPF ou CNPJ</Label>
            <Input
              id="cpfCnpj"
              value={watch("cpfCnpj")}
              onChange={(e) => setValue("cpfCnpj", maskCpfCnpj(e.target.value), { shouldValidate: true })}
            />
            {errors.cpfCnpj && <p className="text-xs text-destructive">{errors.cpfCnpj.message}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="emailFaturamento">E-mail de Faturamento</Label>
            <Input id="emailFaturamento" type="email" {...register("emailFaturamento")} />
            {errors.emailFaturamento && <p className="text-xs text-destructive">{errors.emailFaturamento.message}</p>}
          </div>

          {/* Celular */}
          <div className="space-y-1.5">
            <Label htmlFor="celular">Celular</Label>
            <Input
              id="celular"
              value={watch("celular")}
              onChange={(e) => setValue("celular", maskPhone(e.target.value), { shouldValidate: true })}
              placeholder="(00) 00000-0000"
            />
            {errors.celular && <p className="text-xs text-destructive">{errors.celular.message}</p>}
          </div>

          {/* CEP */}
          <div className="space-y-1.5">
            <Label htmlFor="cep">CEP</Label>
            <div className="relative">
              <Input id="cep" value={watch("cep")} onChange={handleCepChange} placeholder="00000-000" />
              {fetchingCep && (
                <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {errors.cep && <p className="text-xs text-destructive">{errors.cep.message}</p>}
          </div>

          {/* Logradouro + Número */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="logradouro">Logradouro</Label>
              <Input id="logradouro" {...register("logradouro")} placeholder="Rua, Avenida..." />
              {errors.logradouro && <p className="text-xs text-destructive">{errors.logradouro.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="numero">Número</Label>
              <Input id="numero" {...register("numero")} placeholder="123" />
              {errors.numero && <p className="text-xs text-destructive">{errors.numero.message}</p>}
            </div>
          </div>

          {/* Bairro + Complemento */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bairro">Bairro</Label>
              <Input id="bairro" {...register("bairro")} />
              {errors.bairro && <p className="text-xs text-destructive">{errors.bairro.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="complemento">
                Complemento <span className="text-muted-foreground text-xs">(opcional)</span>
              </Label>
              <Input id="complemento" {...register("complemento")} placeholder="Apto, Sala..." />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Gerar Pagamento Seguro"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutDialog;
