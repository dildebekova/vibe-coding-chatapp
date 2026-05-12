from pydantic import UUID4, AliasChoices, BaseModel, ConfigDict, EmailStr, Field, field_validator

from src.config import settings


class GoogleLoginSchema(BaseModel):
    access_token: str


class UserLoginResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    # ORM uses `.guid`; API contract uses `user_guid`.
    guid: UUID4 = Field(..., validation_alias=AliasChoices("guid", "user_guid"), serialization_alias="user_guid")
    username: str
    email: EmailStr
    first_name: str
    last_name: str
    user_image: str | None
    settings: dict

    @field_validator("user_image")
    @classmethod
    def add_image_host(cls, image_url: str | None) -> str:
        if image_url:
            if "/static/" in image_url and settings.ENVIRONMENT == "development":
                return settings.STATIC_HOST + image_url
        return image_url


class LoginResponseSchema(UserLoginResponseSchema):
    """Same as login user payload plus tokens for SPA clients (localStorage)."""

    access_token: str
    refresh_token: str


class RefreshTokenBodySchema(BaseModel):
    refresh_token: str | None = None
