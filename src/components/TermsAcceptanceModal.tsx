import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TermsAcceptanceModalProps {
  open: boolean;
  userId: string;
  onAccepted: () => void;
}

const TermsAcceptanceModal = ({ open, userId, onAccepted }: TermsAcceptanceModalProps) => {
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAccept = async () => {
    setSubmitting(true);
    try {
      let ipAddress = "unknown";
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipRes.json();
        ipAddress = ipData.ip;
      } catch {
        // silently fallback
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString(),
          terms_version: "1.0",
          terms_ip_address: ipAddress,
        })
        .eq("user_id", userId);

      if (error) throw error;
      onAccepted();
    } catch (err: any) {
      toast.error("Erro ao salvar aceite. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg [&>button]:hidden" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-lg">Aviso de Responsabilidade e Gestão de Conformidade (v1.0)</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground leading-relaxed py-2">
          Ao utilizar o Safe Solutions, você declara estar ciente de que o sistema é uma ferramenta de suporte
          administrativo e monitoramento de prazos. Esta versão não substitui a necessidade da coleta de assinatura
          física do colaborador em fichas de EPI próprias (NR-6). O Safe Solutions deve ser utilizado para garantir
          que prazos não sejam perdidos e que apenas colaboradores aptos sejam alocados em obras.
        </div>
        <div className="flex items-start gap-3 py-2">
          <Checkbox id="terms" checked={checked} onCheckedChange={(v) => setChecked(v === true)} />
          <label htmlFor="terms" className="text-sm leading-snug cursor-pointer">
            Li e concordo que o Safe Solutions v1.0 é um sistema de apoio e não substitui o documento legal assinado fisicamente.
          </label>
        </div>
        <DialogFooter>
          <Button onClick={handleAccept} disabled={!checked || submitting} className="w-full sm:w-auto">
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TermsAcceptanceModal;
