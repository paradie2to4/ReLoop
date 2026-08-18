"""Seeds ReLoop with realistic demo data (Rwandan context, prices in RWF).

Usage:
    python manage.py seed_data            # keep existing data, add more
    python manage.py seed_data --flush     # wipe domain data first
"""

import random
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.accounts.models import User
from apps.donations.models import DonationRequest
from apps.exchanges.models import ExchangeRequest
from apps.notifications.models import Notification
from apps.orders.models import Cart, CartItem, Order, OrderItem
from apps.orders.services import checkout_cart, transition_order_status
from apps.products.models import Category, Product, ProductImage, Wishlist, WishlistItem
from apps.repairs.models import RepairProvider, RepairRequest
from apps.reviews.models import Review

LOCATIONS = ["Kigali", "Huye", "Musanze", "Rubavu", "Muhanga", "Rusizi"]

# Maps each product's image slug to real search keywords (used against a
# keyword-based photo source) so the placeholder photo actually resembles
# the listing instead of being an arbitrary random stock photo.
IMAGE_KEYWORDS = {
    "mountain-bike": "mountain,bike",
    "iphone11": "iphone,smartphone",
    "galaxy-a54": "android,smartphone",
    "hp-laptop": "laptop,computer",
    "dell-latitude": "laptop,office",
    "school-books": "books,stack",
    "textbooks": "textbook,books",
    "sofa": "sofa,couch",
    "dining-table": "dining,table",
    "office-desk": "office,desk",
    "leather-jacket": "leather,jacket",
    "ankara-dresses": "dress,fabric",
    "nike-shoes": "sneakers,shoes",
    "kids-shoes": "kids,shoes",
    "microwave": "microwave,kitchen",
    "fridge": "refrigerator,kitchen",
    "kettle": "kettle,electric",
    "cookware": "cookware,pots",
    "football": "football,soccer",
    "badminton": "badminton,racket",
    "stroller": "stroller,baby",
    "baby-clothes": "baby,clothes",
    "kids-bike": "bicycle,kids",
    "helmet": "helmet,motorcycle",
    "watch": "wristwatch,watch",
    "speaker": "speaker,bluetooth",
    "led-tv": "television,tv",
    "ps4": "playstation,gaming",
    "sewing-machine": "sewing,machine",
    "tent": "camping,tent",
    "office-chair": "office,chair",
    "utensils": "kitchen,utensils",
    "camera": "camera,dslr",
}

CATEGORIES = [
    ("Electronics", "electronics"),
    ("Phones", "phone-portrait"),
    ("Computers", "laptop"),
    ("Furniture", "sofa"),
    ("Clothing", "shirt"),
    ("Shoes", "footsteps"),
    ("Books", "book"),
    ("Home Appliances", "flash"),
    ("Kitchen", "restaurant"),
    ("Sports", "basketball"),
    ("Baby Items", "happy"),
    ("Vehicles", "bicycle"),
    ("Accessories", "watch"),
    ("Other", "cube"),
]

PRODUCTS = [
    ("Used Mountain Bicycle", "Vehicles", "SALE_OR_EXCHANGE", 75000, "GOOD", "Kigali", "mountain-bike"),
    ("iPhone 11 - 64GB", "Phones", "FOR_SALE", 210000, "LIKE_NEW", "Kigali", "iphone11"),
    ("Samsung Galaxy A54", "Phones", "FOR_SALE", 185000, "GOOD", "Musanze", "galaxy-a54"),
    ("HP Pavilion Laptop 15\"", "Computers", "FOR_SALE", 420000, "GOOD", "Kigali", "hp-laptop"),
    ("Dell Latitude Business Laptop", "Computers", "SALE_OR_EXCHANGE", 380000, "FAIR", "Huye", "dell-latitude"),
    ("Old School Books Bundle (10 books)", "Books", "FREE_DONATION", 0, "GOOD", "Huye", "school-books"),
    ("Engineering Textbooks Set", "Books", "FREE_DONATION", 0, "FAIR", "Kigali", "textbooks"),
    ("3-Seater Sofa", "Furniture", "FOR_SALE", 150000, "GOOD", "Kigali", "sofa"),
    ("Wooden Dining Table + 4 Chairs", "Furniture", "FOR_SALE", 220000, "GOOD", "Muhanga", "dining-table"),
    ("Office Desk", "Furniture", "FOR_EXCHANGE", 0, "LIKE_NEW", "Kigali", "office-desk"),
    ("Men's Leather Jacket", "Clothing", "FOR_SALE", 35000, "LIKE_NEW", "Kigali", "leather-jacket"),
    ("Women's Ankara Dresses (5 pcs)", "Clothing", "FREE_DONATION", 0, "GOOD", "Rubavu", "ankara-dresses"),
    ("Nike Running Shoes", "Shoes", "FOR_SALE", 28000, "GOOD", "Kigali", "nike-shoes"),
    ("Kids School Shoes", "Shoes", "FREE_DONATION", 0, "FAIR", "Huye", "kids-shoes"),
    ("Microwave Oven", "Home Appliances", "FOR_SALE", 45000, "GOOD", "Kigali", "microwave"),
    ("Refrigerator - Needs Compressor Repair", "Home Appliances", "FOR_SALE", 60000, "NEEDS_REPAIR", "Musanze", "fridge"),
    ("Electric Kettle", "Kitchen", "FOR_SALE", 8000, "LIKE_NEW", "Kigali", "kettle"),
    ("Non-stick Cookware Set", "Kitchen", "SALE_OR_EXCHANGE", 32000, "GOOD", "Rusizi", "cookware"),
    ("Football (FIFA Certified)", "Sports", "FOR_SALE", 15000, "GOOD", "Kigali", "football"),
    ("Badminton Racket Set", "Sports", "FOR_EXCHANGE", 0, "GOOD", "Huye", "badminton"),
    ("Baby Stroller", "Baby Items", "FOR_SALE", 55000, "GOOD", "Kigali", "stroller"),
    ("Baby Clothes Bundle (0-12 months)", "Baby Items", "FREE_DONATION", 0, "GOOD", "Muhanga", "baby-clothes"),
    ("Mountain Bike - Kids Size", "Vehicles", "FOR_SALE", 45000, "FAIR", "Rubavu", "kids-bike"),
    ("Motorbike Helmet", "Accessories", "FOR_SALE", 18000, "LIKE_NEW", "Kigali", "helmet"),
    ("Leather Wristwatch", "Accessories", "SALE_OR_EXCHANGE", 25000, "GOOD", "Kigali", "watch"),
    ("Bluetooth Speaker", "Electronics", "FOR_SALE", 32000, "GOOD", "Kigali", "speaker"),
    ("32\" LED TV - Screen Needs Repair", "Electronics", "FOR_SALE", 70000, "NEEDS_REPAIR", "Musanze", "led-tv"),
    ("PlayStation 4 Console", "Electronics", "SALE_OR_EXCHANGE", 240000, "GOOD", "Kigali", "ps4"),
    ("Sewing Machine", "Home Appliances", "FOR_EXCHANGE", 0, "GOOD", "Huye", "sewing-machine"),
    ("Camping Tent (4-person)", "Sports", "FOR_SALE", 40000, "LIKE_NEW", "Rubavu", "tent"),
    ("Office Chair - Ergonomic", "Furniture", "FOR_SALE", 65000, "GOOD", "Kigali", "office-chair"),
    ("Assorted Kitchen Utensils", "Kitchen", "FREE_DONATION", 0, "FAIR", "Rusizi", "utensils"),
    ("Canon DSLR Camera", "Electronics", "SALE_OR_EXCHANGE", 320000, "GOOD", "Kigali", "camera"),
]

REPAIR_PROVIDERS = [
    ("Kigali Phone Doctors", "Phone Repair", "Kigali", "+250780000001", 4.7),
    ("FixIt Laptop Clinic", "Laptop Repair", "Kigali", "+250780000002", 4.5),
    ("Muhanga Furniture Workshop", "Furniture Repair", "Muhanga", "+250780000003", 4.3),
    ("Huye Shoe Repair Corner", "Shoe Repair", "Huye", "+250780000004", 4.6),
    ("Musanze Appliance Technicians", "Appliance Repair", "Musanze", "+250780000005", 4.2),
]


class Command(BaseCommand):
    help = "Seed the database with realistic ReLoop demo data."

    def add_arguments(self, parser):
        parser.add_argument("--flush", action="store_true", help="Delete existing domain data before seeding.")

    def handle(self, *args, **options):
        if options["flush"]:
            self.stdout.write("Flushing existing domain data...")
            self._flush()

        with transaction.atomic():
            categories = self._seed_categories()
            users = self._seed_users()
            products = self._seed_products(categories, users)
            self._seed_repair_providers()
            self._seed_orders_and_reviews(users, products)
            self._seed_exchanges(users, products)
            self._seed_donations(users, products)
            self._seed_wishlists(users, products)

        self.stdout.write(self.style.SUCCESS("ReLoop demo data seeded successfully."))
        self.stdout.write("Demo accounts (password: DemoPass123!):")
        self.stdout.write("  admin@example.com (administrator)")
        self.stdout.write("  seller@example.com (seller)")
        self.stdout.write("  customer@example.com (customer)")

    def _flush(self):
        for model in [
            Review, RepairRequest, RepairProvider, DonationRequest, ExchangeRequest,
            OrderItem, Order, CartItem, Cart, WishlistItem, Wishlist,
            ProductImage, Product, Category, Notification,
        ]:
            model.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()

    # -- categories -----------------------------------------------------

    def _seed_categories(self):
        categories = {}
        for name, icon in CATEGORIES:
            category, _ = Category.objects.get_or_create(name=name, defaults={"icon": icon})
            categories[name] = category
        self.stdout.write(f"Categories: {len(categories)}")
        return categories

    # -- users ------------------------------------------------------------

    def _seed_users(self):
        password = "DemoPass123!"
        users = {}

        admin, _ = User.objects.get_or_create(
            email="admin@example.com",
            defaults={"full_name": "ReLoop Admin", "location": "Kigali", "is_staff": True, "is_superuser": True, "is_seller": True},
        )
        admin.set_password(password)
        admin.save()
        users["admin"] = admin

        seller_names = [
            ("seller@example.com", "Eric Niyonzima"),
            ("seller2@example.com", "Aline Uwase"),
            ("seller3@example.com", "Jean Bosco Habimana"),
            ("seller4@example.com", "Diane Mukamana"),
        ]
        sellers = []
        for email, name in seller_names:
            user, _ = User.objects.get_or_create(
                email=email,
                defaults={
                    "full_name": name, "location": random.choice(LOCATIONS), "is_seller": True,
                    "bio": "Selling and donating things I no longer need.",
                },
            )
            user.set_password(password)
            user.save()
            sellers.append(user)
        users["sellers"] = sellers
        users["seller"] = sellers[0]

        customer_names = [
            ("customer@example.com", "Claudine Ingabire"),
            ("customer2@example.com", "Patrick Mugisha"),
            ("customer3@example.com", "Sandrine Umutoni"),
        ]
        customers = []
        for email, name in customer_names:
            user, _ = User.objects.get_or_create(
                email=email, defaults={"full_name": name, "location": random.choice(LOCATIONS)}
            )
            user.set_password(password)
            user.save()
            customers.append(user)
        users["customers"] = customers
        users["customer"] = customers[0]

        self.stdout.write(f"Users: {1 + len(sellers) + len(customers)}")
        return users

    # -- products ----------------------------------------------------------

    def _seed_products(self, categories, users):
        sellers = users["sellers"]
        products = []
        for i, (title, cat_name, ttype, price, condition, location, image_seed) in enumerate(PRODUCTS):
            seller = sellers[i % len(sellers)]
            product, created = Product.objects.get_or_create(
                title=title,
                seller=seller,
                defaults={
                    "description": self._description_for(title, condition),
                    "category": categories[cat_name],
                    "transaction_type": ttype,
                    "price": Decimal(price),
                    "condition": condition,
                    "location": location,
                    "quantity": 1,
                    "views_count": random.randint(0, 250),
                    "is_featured": i % 7 == 0,
                },
            )
            if created:
                self._add_placeholder_image(product, image_seed)
            products.append(product)
        self.stdout.write(f"Products: {len(products)}")
        return products

    @staticmethod
    def _description_for(title, condition):
        return (
            f"{title}. Condition: {condition.replace('_', ' ').title()}. "
            "Give it another life instead of throwing it away — message the seller for more details, "
            "pickup and inspection before purchase."
        )

    def _add_placeholder_image(self, product, seed):
        """Downloads a keyword-matched stock photo and saves it through
        Django's active storage backend — Cloudinary in production, local
        disk in dev when no Cloudinary credentials are configured. Never
        fails the whole seed run if the network/image host is unreachable."""
        import urllib.request

        from django.core.files.base import ContentFile

        keywords = IMAGE_KEYWORDS.get(seed, seed.replace("-", ","))
        # lock=<n> pins a specific match for the keywords instead of a fresh
        # random pick on every request, so re-seeding is deterministic.
        lock = abs(hash(seed)) % 100
        url = f"https://loremflickr.com/800/600/{keywords}?lock={lock}"
        try:
            with urllib.request.urlopen(url, timeout=10) as response:
                content = response.read()
        except Exception as exc:  # pragma: no cover - network dependent
            self.stdout.write(self.style.WARNING(f"  Skipped image for '{product.title}': {exc}"))
            return

        image = ProductImage(product=product, is_primary=True, order=0)
        image.image.save(f"{seed}.jpg", ContentFile(content), save=True)

    # -- repair providers ----------------------------------------------------

    def _seed_repair_providers(self):
        for name, specialization, location, phone, rating in REPAIR_PROVIDERS:
            RepairProvider.objects.get_or_create(
                name=name,
                defaults={
                    "description": f"Trusted local {specialization.lower()} service in {location}.",
                    "specialization": specialization,
                    "location": location,
                    "phone": phone,
                    "email": f"{name.lower().replace(' ', '.')}@example.com",
                    "rating": Decimal(str(rating)),
                },
            )
        self.stdout.write(f"Repair providers: {len(REPAIR_PROVIDERS)}")

    # -- orders + reviews ---------------------------------------------------

    def _seed_orders_and_reviews(self, users, products):
        customers = users["customers"]
        sellable = [p for p in products if p.allows_purchase and p.seller not in customers]
        random.shuffle(sellable)

        orders_created = 0
        for customer in customers:
            for product in sellable[orders_created : orders_created + 2]:
                cart, _ = Cart.objects.get_or_create(user=customer)
                CartItem.objects.get_or_create(cart=cart, product=product, defaults={"quantity": 1})
                try:
                    order = checkout_cart(customer, Order.PaymentMethod.CASH, product.location)
                except Exception as exc:  # pragma: no cover
                    self.stdout.write(self.style.WARNING(f"  Skipped order: {exc}"))
                    continue
                transition_order_status(order, new_status=Order.Status.COMPLETED, new_payment_status=Order.PaymentStatus.PAID)
                if not hasattr(order, "review"):
                    seller = order.items.first().seller
                    Review.objects.create(
                        reviewer=customer, seller=seller, order=order,
                        rating=random.randint(4, 5),
                        comment="Great condition, exactly as described. Smooth pickup!",
                    )
                orders_created += 1
        self.stdout.write(f"Completed demo orders: {orders_created}")

    # -- exchanges -----------------------------------------------------------

    def _seed_exchanges(self, users, products):
        exchangeable = [p for p in products if p.allows_exchange and p.status == Product.Status.ACTIVE]
        sellers = users["sellers"]
        count = 0
        for seller in sellers:
            own = [p for p in exchangeable if p.seller == seller]
            others = [p for p in exchangeable if p.seller != seller]
            if not own or not others:
                continue
            offered = own[0]
            requested = others[0]
            exchange, created = ExchangeRequest.objects.get_or_create(
                sender=seller, receiver=requested.seller, offered_product=offered, requested_product=requested,
                defaults={"message": "Would you like to swap? Happy to add a bit of cash if needed."},
            )
            if created:
                count += 1
        self.stdout.write(f"Exchange requests: {count}")

    # -- donations -------------------------------------------------------------

    def _seed_donations(self, users, products):
        donations = [p for p in products if p.is_donation and p.status == Product.Status.ACTIVE]
        customers = users["customers"]
        count = 0
        for i, product in enumerate(donations):
            requester = customers[i % len(customers)]
            if requester == product.seller:
                continue
            _, created = DonationRequest.objects.get_or_create(
                product=product, requester=requester,
                defaults={"message": "I would love to give this a new home. I can pick it up anytime."},
            )
            if created:
                count += 1
        self.stdout.write(f"Donation requests: {count}")

    # -- wishlists -------------------------------------------------------------

    def _seed_wishlists(self, users, products):
        for customer in users["customers"]:
            wishlist, _ = Wishlist.objects.get_or_create(user=customer)
            for product in random.sample(products, k=min(3, len(products))):
                WishlistItem.objects.get_or_create(wishlist=wishlist, product=product)
        self.stdout.write("Wishlists seeded.")
