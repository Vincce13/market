export type Listing = {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  seller_email: string;
  image_url: string | null;
  sold: boolean;
  created_at: string;
};