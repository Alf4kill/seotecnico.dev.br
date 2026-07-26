import Link from 'next/link'
import { buildMetadata } from '@/lib/metadata'
import { site } from '@/lib/site'
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd'

export const metadata = buildMetadata({
  title: 'Política de privacidade',
  description:
    'Como o SEO Técnico trata seus dados: analytics somente com consentimento, sem cadastro, sem venda de dados. Transparência conforme a LGPD.',
  path: '/politica-de-privacidade',
})

export default function PoliticaDePrivacidadePage() {
  return (
    <section className="container max-w-3xl py-12 lg:py-16">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', path: '/' },
          { name: 'Política de privacidade', path: '/politica-de-privacidade' },
        ]}
      />

      <h1 className="font-bold text-foreground text-3xl md:text-4xl">
        Política de privacidade
      </h1>

      <div className="rich-text mt-8">
        <p>
          O {site.name} ({new URL(site.url).hostname}) é um site de conteúdo e
          ferramentas gratuitas. Esta página explica, em linguagem direta, quais
          dados são tratados e por quê — em conformidade com a Lei Geral de
          Proteção de Dados (LGPD, Lei nº 13.709/2018).
        </p>

        <h2>O que coletamos (e o que não coletamos)</h2>
        <ul>
          <li>
            <strong>Não há cadastro, login nem formulários</strong> que
            armazenem dados pessoais. As ferramentas funcionam sem identificação
            e não guardam o que você digita nelas.
          </li>
          <li>
            <strong>Medição de audiência (Google Analytics 4, via Google Tag
            Manager):</strong> usada apenas para entender quais páginas e
            ferramentas são úteis. Os cookies de analytics só são ativados{' '}
            <strong>depois do seu consentimento</strong> no banner — o padrão é
            negado (Consent Mode v2). Recusar não altera nenhuma funcionalidade
            do site.
          </li>
          <li>
            <strong>Não vendemos nem compartilhamos dados</strong> com terceiros
            para fins comerciais, e não veiculamos anúncios.
          </li>
        </ul>

        <h2>Telemetria de requisições e rastreadores automatizados</h2>
        <p>
          O servidor conta, de forma <strong>anônima</strong>, as requisições de
          página que recebe — para medir se e como <strong>rastreadores
          automatizados de IA</strong> (como os da OpenAI, Anthropic, Perplexity
          e Google) leem o conteúdo publicado, e para distinguir tráfego
          automatizado de tráfego humano. Dessa contagem são registrados apenas{' '}
          <strong>o caminho da página, o nome do rastreador quando ele se
          identifica, e sinais técnicos derivados</strong> (por exemplo, se a
          requisição tem o formato de um navegador real). Nenhum endereço IP,
          nenhum cabeçalho bruto e nenhum dado pessoal é armazenado, e tudo vai
          para uma propriedade de análise separada da usada para visitantes
          humanos.
        </p>
        <p>
          Para correlacionar requisições da mesma rede sem identificar ninguém,
          é registrado um <strong>código de rede truncado e embaralhado</strong>{' '}
          (um hash com sal da sub-rede, não do endereço completo), cujo sal
          muda todo mês — o que impede que o código se acumule como um
          identificador durável. Quando uma requisição alega ser de um
          rastreador conhecido, o endereço IP é comparado <strong>na hora, em
          memória</strong>, com as faixas de rede publicadas pelo próprio
          fornecedor, apenas para verificar a alegação; o que se registra é o
          veredito, nunca o endereço.
        </p>
        <p>
          Essa contagem é agregada e anônima, não identifica você
          individualmente e não depende do banner de consentimento. Está
          descrita aqui porque um site cuja proposta é medição transparente
          deve dizer tudo o que mede.
        </p>

        <h2>Sua escolha</h2>
        <p>
          Você pode aceitar ou recusar a medição de audiência no banner de
          consentimento. A escolha fica registrada no seu navegador
          (localStorage) e pode ser revertida a qualquer momento limpando os
          dados do site no navegador — o banner será exibido novamente na
          próxima visita.
        </p>

        <h2>Seus direitos (LGPD)</h2>
        <p>
          A LGPD garante a você direitos como confirmação de tratamento,
          acesso, correção e eliminação de dados pessoais. Como este site não
          mantém base de dados pessoais própria, o único tratamento relevante é
          a estatística de audiência do Google Analytics, que é agregada e não
          identifica você individualmente.
        </p>

        <h2>Contato</h2>
        <p>
          Dúvidas sobre esta política podem ser enviadas pelos canais públicos
          indicados na página <Link href="/sobre" title="Sobre o projeto">Sobre</Link>.
        </p>
      </div>
    </section>
  )
}
