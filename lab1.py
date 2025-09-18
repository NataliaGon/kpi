
import random
from typing import Tuple, Dict, List


def hrn_kop_to_str(cents: int) -> str:
    sign = "-" if cents < 0 else ""
    cents = abs(cents)
    hrn, kop = divmod(cents, 100)
    return f"{sign}{hrn}.{kop:02d} грн"

def parse_amount(user_input: str) -> int:
    """
    Приймає рядок на кшталт "120", "120.50", "120,50" -> повертає копійки (int).
    Підійде і для цілих гривень, і для гривень з копійками.
    """
    s = user_input.strip().replace(",", ".")
    if "." in s:
        hrn_str, kop_str = s.split(".", 1)
        hrn = int(hrn_str) if hrn_str else 0
        kop = int((kop_str + "00")[:2])  
    else:
        hrn, kop = int(s), 0
    return hrn * 100 + kop

def breakdown_banknotes(amount_cents: int) -> Dict[str, int]:
    """
    Повертає розбиття суми за номіналами (опціонально для a8).
    Номінали: 1000, 500, 200, 100, 50, 20, 10 грн; монети 5, 2, 1 грн; 50, 25, 10, 5 коп.
    """
    remaining = amount_cents
    denoms = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50, 25, 10, 5]
    names  = ["1000 грн","500 грн","200 грн","100 грн","50 грн","20 грн","10 грн",
              "5 грн","2 грн","1 грн","50 коп","25 коп","10 коп","5 коп"]
    out = {}
    for d, name in zip(denoms, names):
        if remaining <= 0:
            break
        cnt, remaining = divmod(remaining, d)
        if cnt:
            out[name] = cnt
    return out


SUPPORTED_CARD_TYPES = {1, 2}    
ALLOWED_CODES = {1234, 4321, 2580} 
MAX_PIN_TRIES = 3

def a0_insert_card() -> None:
    print("a0: Будь ласка, вставте картку (введіть тип картки цілим числом).")

def a1_recognize_card(card_type: int) -> bool:
    if card_type not in SUPPORTED_CARD_TYPES:
        print("a13: Тип картки не підтримується цим банкоматом. Картку повернуто.")
        return False
    print("a1: Картку розпізнано.")
    return True

def a2_prompt_pin() -> None:
    print("a2: Введіть PIN-код (ціле число).")

def a3_check_pin(pin: int, tries_left: int) -> Tuple[bool, int]:
    if pin in ALLOWED_CODES:
        print("a3: Код вірний.")
        return True, tries_left
    tries_left -= 1
    if tries_left > 0:
        print(f"a11: Невірний код. Спробуйте ще раз. Залишилось спроб: {tries_left}")
    else:
        print("a12: Невірний код. Картку заблоковано.")
    return False, tries_left

def a4_menu() -> str:
    print("\n=== a4: Меню ===")
    print("1) Стан рахунку")
    print("2) Зняття готівки")
    print("3) Вихід")
    return input("Оберіть операцію (1/2/3): ").strip()

def a5_show_balance(balance: int) -> None:
    print(f"a5: Стан рахунку: {hrn_kop_to_str(balance)}")

def a6_ask_amount() -> int:
    s = input("a6: Введіть суму для зняття (грн або грн.коп): ")
    return parse_amount(s)

def a7_has_funds(balance: int, amount: int) -> bool:
    return balance >= amount

def a8_dispense_cash(balance: int, amount: int) -> int:
    print(f"a8: Видано готівку: {hrn_kop_to_str(amount)}")
    parts = breakdown_banknotes(amount)
    if parts:
        pretty = ", ".join(f"{k} × {v}" for k, v in parts.items())
        print(f"   Номінали: {pretty}")
    balance -= amount
    print(f"   Новий баланс: {hrn_kop_to_str(balance)}")
    return balance

def a9_insufficient() -> None:
    print("a9: Недостатньо коштів на рахунку. Повернення до меню.")

def a10_goodbye() -> None:
    print("a10: Дякуємо! Гарного дня. Картку повернуто.\n")


def main():
    initial_hrn = random.randint(0, 20000) 
    initial_kop = random.randint(0, 99)   
    balance = initial_hrn * 100 + initial_kop
    print(f"[Ініціалізація] Початковий баланс: {hrn_kop_to_str(balance)}")


    a0_insert_card()
    try:
        card_type = int(input("Тип картки (наприклад, 1 або 2): ").strip())
    except ValueError:
        print("a13: Невірний формат типу картки. Картку повернуто.")
        return

    if not a1_recognize_card(card_type):
        return

    a2_prompt_pin()
    tries = MAX_PIN_TRIES
    authed = False
    while tries > 0 and not authed:
        try:
            pin = int(input("PIN: ").strip())
        except ValueError:
            pin = -1
        authed, tries = a3_check_pin(pin, tries)
        if not authed and tries > 0:
            a2_prompt_pin()
    if not authed:
        return  # a12 — блокування

    # a4 — головне меню
    while True:
        choice = a4_menu()
        if choice == "1":
            a5_show_balance(balance)
            # повернення до a4
        elif choice == "2":
            amount = a6_ask_amount()
            if amount <= 0:
                print("Сума має бути додатною.")
                continue
            if a7_has_funds(balance, amount):
                balance = a8_dispense_cash(balance, amount)  # включає корегування і повернення до меню
            else:
                a9_insufficient()
        elif choice == "3":
            a10_goodbye()
            break
        else:
            print("Невірний вибір. Спробуйте ще раз.")


main()
