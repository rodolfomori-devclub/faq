export interface Category {
  id: string;
  name: string;
  slug: string;
  order: number;
}

export interface FAQ {
  id: string;
  categoryId: string;
  question: string;
  answer: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryWithFaqs extends Category {
  faqs: FAQ[];
}

export interface FeaturedCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  link: string;
  color: string;
  order: number;
}
