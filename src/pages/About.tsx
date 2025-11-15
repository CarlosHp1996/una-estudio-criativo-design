import { Card } from "@/components/ui/card";
import { Heart, Paintbrush, Star } from "lucide-react";
import aboutStudio from "@/assets/about-studio.jpg";

const About = () => {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">
            Nossa História
          </h1>
          <p className="text-xl text-muted-foreground">
            Arte feita com amor, dedicação e muito carinho em cada detalhe
          </p>
        </div>

        {/* Main Image */}
        <div className="max-w-4xl mx-auto mb-16">
          <img
            src={aboutStudio}
            alt="Estúdio UNA"
            className="w-full h-[500px] object-cover rounded-lg shadow-elegant"
          />
        </div>

        {/* Story */}
        <div className="max-w-3xl mx-auto mb-16 space-y-6 text-muted-foreground leading-relaxed">
          <p>
            O UNA Estudio Criativo nasceu do amor pela arte e pela vontade de criar peças únicas que pudessem fazer parte da vida das pessoas de forma especial. Cada pincelada é feita com dedicação, cada peça é criada pensando em trazer beleza e significado para os ambientes.
          </p>
          <p>
            Trabalhamos com diferentes materiais - madeira, cerâmica e vidro - sempre mantendo a delicadeza e elegância que são a marca do nosso trabalho. Nossa paleta de cores, com tons de verde sage e branco, reflete a natureza e a serenidade que queremos transmitir.
          </p>
          <p>
            Acreditamos que a arte feita à mão carrega uma energia especial. Cada imperfeição é parte do charme, cada detalhe conta uma história. Quando você escolhe uma peça do UNA, você não está apenas levando um produto para casa, mas uma parte do nosso coração e dedicação.
          </p>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Feito com Amor</h3>
            <p className="text-muted-foreground">
              Cada peça é criada com carinho e dedicação, transmitindo emoção em cada detalhe.
            </p>
          </Card>
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Paintbrush className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Arte Autêntica</h3>
            <p className="text-muted-foreground">
              Cada pintura é única e exclusiva, garantindo que você tenha algo verdadeiramente especial.
            </p>
          </Card>
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">Qualidade Premium</h3>
            <p className="text-muted-foreground">
              Utilizamos apenas materiais de alta qualidade para garantir durabilidade e beleza.
            </p>
          </Card>
        </div>

        {/* Process */}
        <div className="bg-muted rounded-lg p-8 md:p-12 max-w-4xl mx-auto">
          <h2 className="text-3xl font-serif font-bold text-foreground mb-8 text-center">
            Nosso Processo Criativo
          </h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Seleção de Materiais</h3>
                <p className="text-muted-foreground">
                  Escolhemos cuidadosamente cada material, garantindo qualidade e durabilidade.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Preparação</h3>
                <p className="text-muted-foreground">
                  Preparamos cada superfície com carinho, deixando-a pronta para receber a arte.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Pintura</h3>
                <p className="text-muted-foreground">
                  Cada traço é feito à mão, com atenção aos mínimos detalhes e muito amor.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
                4
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Finalização</h3>
                <p className="text-muted-foreground">
                  Finalizamos com acabamentos especiais e embalagem cuidadosa para chegar perfeita até você.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
