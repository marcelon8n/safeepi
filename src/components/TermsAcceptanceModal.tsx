import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
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
      <DialogContent
        className="sm:max-w-2xl [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Termos de Uso e Política de Privacidade — Safe Solutions (v1.0)
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="prose prose-sm max-w-none text-muted-foreground space-y-4">
            <p>
              Bem-vindo(a) ao <strong>Safe Solutions</strong>. Ao acessar e utilizar o nosso sistema, você
              (doravante denominado "Cliente" ou "Usuário") concorda integralmente com os termos e condições
              descritos abaixo. Se não concordar, por favor, não utilize a plataforma.
            </p>

            <h3 className="text-base font-bold text-foreground">1. Natureza do Serviço</h3>
            <p>
              O Safe Solutions é um software como serviço (SaaS) voltado para a gestão e o controle de entrega
              de Equipamentos de Proteção Individual (EPIs) para empresas. O sistema atua como uma ferramenta
              facilitadora para a organização interna da empresa.
            </p>

            <h3 className="text-base font-bold text-foreground">2. Responsabilidade Legal e Segurança do Trabalho</h3>
            <p>
              O Safe Solutions fornece os meios digitais para o registro das entregas, controle de validade e
              gestão de custos. No entanto, a responsabilidade legal perante o Ministério do Trabalho e o
              rigoroso cumprimento da Norma Regulamentadora nº 6 (NR 6) recaem exclusivamente sobre a empresa
              contratante. É de inteira responsabilidade do Cliente:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Adquirir e fornecer EPIs adequados ao risco de cada atividade, com o Certificado de Aprovação (CA) válido no momento da compra.</li>
              <li>Exigir o uso, orientar e treinar o trabalhador sobre a guarda e conservação.</li>
              <li>Substituir imediatamente o EPI quando danificado ou extraviado.</li>
              <li>Inserir os dados verídicos no sistema, como datas de entrega, vencimento e números de CA.</li>
            </ul>

            <h3 className="text-base font-bold text-foreground">3. Validade das Assinaturas Eletrônicas</h3>
            <p>
              O sistema permite o registro de entregas de EPI de forma eletrônica. O Cliente reconhece e aceita
              que o Safe Solutions coleta dados de auditoria (como endereço IP, dispositivo e geração de Hash de
              segurança) no momento do registro da entrega para garantir a integridade da informação. O Cliente
              concorda em utilizar este formato como meio de comprovação interna de entrega, responsabilizando-se
              por colher o aceite ou a assinatura física na Ficha Individual de EPI quando exigido por
              fiscalizações ou normas sindicais específicas.
            </p>

            <h3 className="text-base font-bold text-foreground">4. Planos, Período de Teste e Pagamentos</h3>
            <p>
              Oferecemos um período de teste gratuito (Trial) de 15 dias corridos. Após este prazo, o acesso ao
              sistema será suspenso. Para continuar utilizando o Safe Solutions, o Cliente deverá aderir a um dos
              nossos planos pagos (Mensal ou Anual). Os pagamentos são processados por gateways parceiros
              homologados (Asaas) e a inadimplência acarretará o bloqueio temporário do acesso aos dados até a
              regularização.
            </p>

            <h3 className="text-base font-bold text-foreground">5. Privacidade e Isolamento de Dados (LGPD)</h3>
            <p>O Safe Solutions atua em conformidade com a Lei Geral de Proteção de Dados (LGPD).</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Isolamento Multitenant:</strong> Garantimos que os dados da sua empresa, colaboradores e
                relatórios são rigorosamente isolados e criptografados. Nenhum outro cliente tem acesso às suas
                informações.
              </li>
              <li>
                <strong>Uso dos Dados:</strong> Coletamos informações de colaboradores (nome, cargo, setor) apenas
                para a finalidade de gestão de EPIs. Não vendemos ou compartilhamos seus dados com terceiros para
                fins publicitários.
              </li>
              <li>
                <strong>Auditoria:</strong> O sistema registra automaticamente logs de ações (criação, alteração e
                exclusão de dados) vinculando-os ao usuário logado e ao seu endereço IP, para fins de segurança e
                auditoria técnica.
              </li>
            </ul>

            <h3 className="text-base font-bold text-foreground">6. Limitação de Responsabilidade</h3>
            <p>
              O sistema é fornecido "no estado em que se encontra". O Safe Solutions utiliza automações para o
              envio de alertas de vencimento, porém, eventuais falhas de comunicação de rede, bloqueios por
              provedores de e-mail (Spam) ou configurações incorretas por parte do usuário não responsabilizam o
              Safe Solutions por prazos perdidos. O Cliente isenta o Safe Solutions de qualquer responsabilidade
              sobre multas trabalhistas, processos judiciais, acidentes de trabalho ou passivos decorrentes de
              falhas na gestão física dos EPIs.
            </p>

            <div className="border-t border-border pt-4 mt-4">
              <p className="text-xs text-muted-foreground italic">
                Ao clicar em "Aceitar", o registro da sua concordância, bem como seu endereço IP e a data e hora
                do aceite, serão gravados em nosso banco de dados de forma inalterável, firmando este contrato
                digital.
              </p>
            </div>
          </div>
        </ScrollArea>

        <div className="flex items-start gap-3 pt-2 border-t border-border">
          <Checkbox id="terms" checked={checked} onCheckedChange={(v) => setChecked(v === true)} />
          <label htmlFor="terms" className="text-sm leading-snug cursor-pointer">
            Li e concordo integralmente com os Termos de Uso e a Política de Privacidade do Safe Solutions (v1.0).
          </label>
        </div>

        <DialogFooter>
          <Button onClick={handleAccept} disabled={!checked || submitting} className="w-full sm:w-auto">
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Aceitar e Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TermsAcceptanceModal;
