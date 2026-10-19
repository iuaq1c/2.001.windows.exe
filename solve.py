from math import isqrt

n = 1569373247920223191538041739239582153669128304522086582209
e = 65537
c = 14970984586229452543687743050140672697852815206198748863


def fermat_factor(n: int):
    """n = p*q, где q - p мало по сравнению с sqrt(n)."""
    a = isqrt(n)
    if a * a < n:
        a += 1
    while True:
        b2 = a * a - n
        b = isqrt(b2)
        if b * b == b2:
            return a - b, a + b
        a += 1


def int_to_bytes(m: int) -> bytes:
    return m.to_bytes((m.bit_length() + 7) // 8, "big")


def main() -> None:
    p, q = fermat_factor(n)
    assert p * q == n, "факторизация неверна"
    assert p < q

    print(f"p      = {p}")
    print(f"q      = {q}")
    print(f"q - p  = {q - p}")
    print(f"бит(p) = {p.bit_length()}, бит(q) = {q.bit_length()}")

    phi = (p - 1) * (q - 1)
    d = pow(e, -1, phi)
    m = pow(c, d, n)

    plaintext = int_to_bytes(m)
    print(f"\nplaintext (hex): {plaintext.hex()}")
    print(f"флаг: {plaintext.decode(errors='replace')}")


if __name__ == "__main__":
    main()