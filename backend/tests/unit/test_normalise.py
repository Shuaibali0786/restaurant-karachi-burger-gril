import pytest

from app.core.normalise import normalise_email, normalise_pk_mobile


@pytest.mark.parametrize(
    "raw",
    [
        "0300 1234567",
        "0300-1234567",
        "+92 300 1234567",
        "+923001234567",
        "00923001234567",
        "923001234567",
        " 03001234567 ",
    ],
)
def test_accepts_common_pakistani_mobile_formats(raw: str):
    assert normalise_pk_mobile(raw) == "+923001234567"


@pytest.mark.parametrize(
    "raw", ["", "0212345678", "03001234", "+923001234567890", "abc", "+1 415 555 0100", "0400 1234567"]
)
def test_rejects_other_numbers(raw: str):
    assert normalise_pk_mobile(raw) is None


def test_email_is_trimmed_and_lowercased():
    assert normalise_email("  Ayesha.K@Example.COM ") == "ayesha.k@example.com"


@pytest.mark.parametrize("raw", ["", "no-at-sign", "a@b", "a b@c.com", "@x.com", "x@" + "a" * 250 + ".com"])
def test_rejects_bad_email(raw: str):
    assert normalise_email(raw) is None
