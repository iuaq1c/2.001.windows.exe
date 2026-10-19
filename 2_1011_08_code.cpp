#include <iostream>
#include <string>
#include <array>
#include <cstdint>

using namespace std;

static uint8_t step(uint8_t x, uint8_t k) {
    x ^= k;
    x = static_cast<uint8_t>(x + 0x19);
    return static_cast<uint8_t>((x >> 2) | (x << 6));
}

static bool verify(const string& s) {
    const array<uint8_t, 20> table = {
        0x21, 0x8D, 0x0B, 0x98, 0x27, 0x6E, 0x0B, 0x62, 0x01, 0x28, 0x9F, 0x44, 0xC4, 0xBE, 0x36, 0xF7, 0x44, 0xA1, 0xA7, 0xB9
    };

    const array<uint8_t, 20> keys = {
        0x41, 0x13, 0x77, 0x22, 0x58, 0x05, 0x31, 0x66, 0x14, 0x27, 0x53, 0x09, 0x6A, 0x18, 0x44, 0x72, 0x2B, 0x35, 0x5E, 0x11
    };

    if (s.size() != table.size()) {
        return false;
    }

    uint8_t state = 0x5C;

    for (size_t i = 0; i < s.size(); ++i) {
        uint8_t x = static_cast<uint8_t>(s[i]);

        x ^= state;
        x = step(x, keys[i]);

        if (x != table[i]) {
            return false;
        }

        state = static_cast<uint8_t>(
            state + x + static_cast<uint8_t>(i)
        );
    }

    return state == 0x6D;
}

int main() {
    string code;

    cout << "Enter access code: ";
    cin >> code;

    if (verify(code)) {
        cout << "Access granted\n";
    } else {
        cout << "Access denied\n";
    }

    return 0;
}