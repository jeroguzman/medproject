from collections.abc import Mapping

from rest_framework import serializers


class StrictSerializerMixin:
    def to_internal_value(self, data):
        if isinstance(data, Mapping):
            allowed = {
                name for name, field in self.fields.items() if not field.read_only
            }
            unknown = set(data) - allowed
            if unknown:
                raise serializers.ValidationError(
                    {
                        name: ["Este campo no está permitido."]
                        for name in sorted(unknown)
                    }
                )
        return super().to_internal_value(data)
