from Crypto.Util.number import getPrime
from sympy import nextprime

p = getPrime(96)

q = nextprime(p + 10**17)

n = p * q
e = 65537


def encrypt(message: bytes, n: int, e: int):
    m = int.from_bytes(message, "big")

    if m >= n:
        raise ValueError("Message is too large")

    return pow(m, e, n)
