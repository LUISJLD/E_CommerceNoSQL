export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  image: string;
  category: string;
}

export interface User {
  username: string;
  address: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
}
