"""camelCase JSON on the wire, so responses match frontend/src/lib/types.ts with no mapping."""

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Response models: read from ORM objects, emit camelCase."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


class CamelRequest(BaseModel):
    """Request models: camelCase in, and unknown fields (for example browser-sent prices) are refused."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="forbid")
