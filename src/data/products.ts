import productPlaque from "@/assets/product-plaque.jpg";
import productPlate from "@/assets/product-plate.jpg";
import productCup from "@/assets/product-cup.jpg";

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  images: string[];
}

export const products: Product[] = [
  {
    id: "1",
    name: "Placa Decorativa Flores Delicadas",
    price: 89.90,
    image: productPlaque,
    category: "Placas",
    description: "Placa decorativa em madeira com pintura à mão de flores delicadas em tons de verde sage. Peça única e exclusiva, perfeita para decorar ambientes com charme e personalidade.",
    images: [productPlaque, productPlaque, productPlaque],
  },
  {
    id: "2",
    name: "Prato Decorativo Botânico",
    price: 125.00,
    image: productPlate,
    category: "Pratos",
    description: "Prato em cerâmica com pintura botânica feita à mão. Design minimalista e elegante, ideal para decoração de paredes ou uso em ocasiões especiais.",
    images: [productPlate, productPlate, productPlate],
  },
  {
    id: "3",
    name: "Copo Pintado Folhagem",
    price: 45.00,
    image: productCup,
    category: "Copos",
    description: "Copo de vidro com pintura delicada de folhagens. Cada traço é feito à mão, tornando cada peça única e especial.",
    images: [productCup, productCup, productCup],
  },
  {
    id: "4",
    name: "Placa Personalizada Floral",
    price: 95.00,
    image: productPlaque,
    category: "Personalizados",
    description: "Placa personalizada com seu nome ou frase especial, decorada com elementos florais pintados à mão.",
    images: [productPlaque, productPlaque, productPlaque],
  },
  {
    id: "5",
    name: "Prato Jardim Verde",
    price: 135.00,
    image: productPlate,
    category: "Pratos",
    description: "Prato decorativo com tema jardim, pintado à mão com detalhes em verde sage e branco.",
    images: [productPlate, productPlate, productPlate],
  },
  {
    id: "6",
    name: "Copo Dupla Natureza",
    price: 52.00,
    image: productCup,
    category: "Copos",
    description: "Par de copos decorados com motivos naturais, perfeitos para presentear ou decorar sua casa.",
    images: [productCup, productCup, productCup],
  },
];

export const categories = [
  "Todos",
  "Placas",
  "Pratos",
  "Copos",
  "Personalizados",
];
