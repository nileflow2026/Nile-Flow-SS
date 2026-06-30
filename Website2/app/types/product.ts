export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  images: string[];
  categoryId: string;
  categoryName: string;
  artisanId?: string;
  artisanName?: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  isPremium: boolean;
  tags: string[];
  createdAt: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  image: string;
  productCount: number;
}

export interface ProductReview {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
}
