/**
 * Demo product images organized by category.
 * All sourced from Unsplash (free-to-use).
 * Used by AddProductForm and ProductDetailModal.
 */
export const DEMO_PRODUCT_CATEGORIES = [
  {
    key: 'food',
    label: 'Food & Beverages',
    icon: 'restaurant',
    images: [
      { url: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400&h=300&fit=crop&q=80', label: 'Fresh Fruits' },
      { url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop&q=80', label: 'Artisan Bread' },
      { url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop&q=80', label: 'Coffee Cup' },
      { url: 'https://images.unsplash.com/photo-1560008581-09826d1de69e?w=400&h=300&fit=crop&q=80', label: 'Fresh Juice' },
      { url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&q=80', label: 'Healthy Bowl' },
      { url: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=300&fit=crop&q=80', label: 'Breakfast Plate' },
      { url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop&q=80', label: 'Chocolate' },
      { url: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400&h=300&fit=crop&q=80', label: 'Pasta Dish' },
    ],
  },
  {
    key: 'grocery',
    label: 'Grocery',
    icon: 'local_grocery_store',
    images: [
      { url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop&q=80', label: 'Fresh Vegetables' },
      { url: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=400&h=300&fit=crop&q=80', label: 'Spices' },
      { url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=300&fit=crop&q=80', label: 'Olive Oil' },
      { url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=300&fit=crop&q=80', label: 'Rice & Grains' },
      { url: 'https://images.unsplash.com/photo-1573821663912-5699033388f6?w=400&h=300&fit=crop&q=80', label: 'Canned Goods' },
      { url: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400&h=300&fit=crop&q=80', label: 'Dairy Products' },
    ],
  },
  {
    key: 'clothing',
    label: 'Clothing & Fashion',
    icon: 'checkroom',
    images: [
      { url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop&q=80', label: 'T-Shirts' },
      { url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=300&fit=crop&q=80', label: 'Denim Jeans' },
      { url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=300&fit=crop&q=80', label: 'Leather Jacket' },
      { url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop&q=80', label: 'Sneakers' },
      { url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=300&fit=crop&q=80', label: 'Winter Jacket' },
      { url: 'https://images.unsplash.com/photo-1434389677669-e08b4cda3a8d?w=400&h=300&fit=crop&q=80', label: 'Handbag' },
      { url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=300&fit=crop&q=80', label: 'Socks Set' },
      { url: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400&h=300&fit=crop&q=80', label: 'Watch' },
    ],
  },
  {
    key: 'electronics',
    label: 'Electronics',
    icon: 'devices',
    images: [
      { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop&q=80', label: 'Headphones' },
      { url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop&q=80', label: 'Camera' },
      { url: 'https://images.unsplash.com/photo-1585298723682-7115561c51b7?w=400&h=300&fit=crop&q=80', label: 'Laptop' },
      { url: 'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=400&h=300&fit=crop&q=80', label: 'Smart Watch' },
      { url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=300&fit=crop&q=80', label: 'Wireless Earbuds' },
      { url: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=300&fit=crop&q=80', label: 'Tablet' },
      { url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop&q=80', label: 'Smartphone' },
      { url: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=400&h=300&fit=crop&q=80', label: 'Speaker' },
    ],
  },
  {
    key: 'home',
    label: 'Home & Kitchen',
    icon: 'home',
    images: [
      { url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&q=80', label: 'Kitchenware' },
      { url: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&h=300&fit=crop&q=80', label: 'Living Room' },
      { url: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&h=300&fit=crop&q=80', label: 'Ceramic Vase' },
      { url: 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=400&h=300&fit=crop&q=80', label: 'Candle Set' },
      { url: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=400&h=300&fit=crop&q=80', label: 'Furniture' },
      { url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&h=300&fit=crop&q=80', label: 'Rug & Decor' },
      { url: 'https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=400&h=300&fit=crop&q=80', label: 'Cookware' },
    ],
  },
  {
    key: 'beauty',
    label: 'Beauty & Personal Care',
    icon: 'spa',
    images: [
      { url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop&q=80', label: 'Skincare Set' },
      { url: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=300&fit=crop&q=80', label: 'Perfume' },
      { url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=300&fit=crop&q=80', label: 'Makeup Kit' },
      { url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=300&fit=crop&q=80', label: 'Hair Care' },
      { url: 'https://images.unsplash.com/photo-1585232004423-244e0e6904e3?w=400&h=300&fit=crop&q=80', label: 'Soap Bar' },
      { url: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=300&fit=crop&q=80', label: 'Essential Oils' },
    ],
  },
  {
    key: 'accessories',
    label: 'Accessories',
    icon: 'watch',
    images: [
      { url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=300&fit=crop&q=80', label: 'Sunglasses' },
      { url: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&h=300&fit=crop&q=80', label: 'Backpack' },
      { url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop&q=80', label: 'Travel Bag' },
      { url: 'https://images.unsplash.com/photo-1622434641406-a158123450f9?w=400&h=300&fit=crop&q=80', label: 'Luxury Watch' },
      { url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&h=300&fit=crop&q=80', label: 'Wallet' },
      { url: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=400&h=300&fit=crop&q=80', label: 'Jewelry' },
      { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=300&fit=crop&q=80', label: 'Fashion Accessory' },
    ],
  },
  {
    key: 'sports',
    label: 'Sports & Fitness',
    icon: 'fitness_center',
    images: [
      { url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop&q=80', label: 'Gym Equipment' },
      { url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&h=300&fit=crop&q=80', label: 'Running Shoes' },
      { url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop&q=80', label: 'Yoga Mat' },
      { url: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=400&h=300&fit=crop&q=80', label: 'Dumbbells' },
      { url: 'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=400&h=300&fit=crop&q=80', label: 'Water Bottle' },
      { url: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&h=300&fit=crop&q=80', label: 'Outdoor Gear' },
    ],
  },
  {
    key: 'handmade',
    label: 'Handmade & Crafts',
    icon: 'palette',
    images: [
      { url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop&q=80', label: 'Art Supplies' },
      { url: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400&h=300&fit=crop&q=80', label: 'Handmade Pottery' },
      { url: 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=400&h=300&fit=crop&q=80', label: 'Knitted Goods' },
      { url: 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?w=400&h=300&fit=crop&q=80', label: 'Wooden Crafts' },
      { url: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400&h=300&fit=crop&q=80', label: 'Handwoven Textile' },
      { url: 'https://images.unsplash.com/photo-1560421683-6856ea585c78?w=400&h=300&fit=crop&q=80', label: 'Candle Making' },
    ],
  },
];

/** Flat list of all images for backward compatibility */
export const ALL_DEMO_IMAGES = DEMO_PRODUCT_CATEGORIES.flatMap((cat) =>
  cat.images.map((img) => ({ ...img, category: cat.key }))
);
