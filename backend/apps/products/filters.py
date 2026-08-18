import django_filters as filters

from .models import Product


class ProductFilter(filters.FilterSet):
    category = filters.CharFilter(field_name="category__slug", lookup_expr="iexact")
    min_price = filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = filters.NumberFilter(field_name="price", lookup_expr="lte")
    condition = filters.CharFilter(field_name="condition", lookup_expr="iexact")
    transaction_type = filters.CharFilter(field_name="transaction_type", lookup_expr="iexact")
    location = filters.CharFilter(field_name="location", lookup_expr="icontains")
    seller = filters.NumberFilter(field_name="seller_id")

    class Meta:
        model = Product
        fields = ["category", "min_price", "max_price", "condition", "transaction_type", "location", "seller"]
