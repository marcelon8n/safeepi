import { useEffect, useState } from "react";
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
    return d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
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
  cpfCnpj: z
    .string()
    .trim()
    .min(14, "CPF ou CNPJ inválido")
    .max(18),
  emailFaturamento: z.string().trim().email("E-mail inválido").max(255),
  celular: z.string().trim().min(14, "Celular inválido").max(15),
  cep: z.string().trim().min(9, "CEP inválido").max(9),
  numero: z.string().trim().min(1, "Informe o número").max(10),
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

  /* fetch empresa data for auto-fill */
  const { data: empresa } = useQuery({
    queryKey: ["empresa-checkout", empresaId],
    queryFn: async () => {
      if (!empresaId) return null;
      const { data } = await supabase
        .from("empresas")
        .select("nome_fantasia, cnpj")
        .eq("id", empresaId)
        .maybeSingle();
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
      numero: "",
    },
  });

  /* auto-fill when empresa data arrives */
  useEffect(() => {
    if (empresa) {
      setValue("razaoSocial", empresa.nome_fantasia ?? "");
      setValue("cpfCnpj", maskCpfCnpj(empresa.cnpj ?? ""));
    }
    if (user?.email) {
      setValue("emailFaturamento", user.email);
    }
  }, [empresa, user, setValue]);

  /* reset form when dialog closes */
  useEffect(() => {
    if (!open) {
      reset();
      setSubmitting(false);
    }
  }, [open, reset]);

  const onSubmit = async (values: CheckoutFormValues) => {
    setSubmitting(true);
    // Simulated submission
    console.log("🧾 Checkout payload:", {
      plano: plan?.name,
      preco: plan?.price,
      ...values,
      cpfCnpjLimpo: values.cpfCnpj.replace(/\D/g, ""),
      celularLimpo: values.celular.replace(/\D/g, ""),
      cepLimpo: values.cep.replace(/\D/g, ""),
    });

    await new Promise((r) => setTimeout(r, 1500));

    toast({
      title: "Pagamento gerado com sucesso!",
      description: `Sua assinatura do plano ${plan?.name} foi iniciada.`,
    });
    setSubmitting(false);
    onOpenChange(false);
  };

  if (!plan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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

          {/* CEP + Número */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                value={watch("cep")}
                onChange={(e) => setValue("cep", maskCep(e.target.value), { shouldValidate: true })}
                placeholder="00000-000"
              />
              {errors.cep && <p className="text-xs text-destructive">{errors.cep.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="numero">Número</Label>
              <Input id="numero" {...register("numero")} placeholder="123" />
              {errors.numero && <p className="text-xs text-destructive">{errors.numero.message}</p>}
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
