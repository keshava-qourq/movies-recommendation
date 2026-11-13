"""Pydantic request and response models.

One pair per entity in the approved data model, plus the placeholder every
generated route returns until it has been implemented.
"""

from pydantic import BaseModel, EmailStr, Field, field_validator


class Credentials(BaseModel):
    """Login body. Extra fields are ignored; the password is never trimmed."""

    email: EmailStr
    password: str

    @field_validator("email", mode="before")
    @classmethod
    def _trim_email(cls, value: object) -> object:
        return value.strip() if isinstance(value, str) else value


class SignupRequest(Credentials):
    password: str = Field(min_length=8)


class UserOut(BaseModel):
    id: int
    email: str
    role: str


class AuthResponse(BaseModel):
    token: str
    user: UserOut


class StubResponse(BaseModel):
    """What a generated route returns until someone implements it.

    A stub that returns a typed body rather than raising keeps the service
    startable and its OpenAPI document complete, so the frontend can be built
    against the agreed shape while the handlers are still being written.
    """

    endpoint: str
    status: str = "not_implemented"
    detail: str = "Scaffolded from the approved API spec; no behaviour yet."
