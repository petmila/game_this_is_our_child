from pathlib import Path
import json
import re
from openpyxl import load_workbook

PROJECT_ROOT = Path(__file__).resolve().parent.parent
EXCEL_PATH = PROJECT_ROOT / "source" / "cards.xlsx"
OUTPUT_DIR = PROJECT_ROOT / "data"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def normalize_number(value):
    """
    Приводит Excel-числа к нормальным JSON-числам.
    """
    if value is None:
        return None
    if isinstance(value, bool):
        return value
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        if value.is_integer():
            return int(value)
        return value
    if isinstance(value, str):
        match = re.fullmatch(
            r"=\s*(-?\d+(?:[.,]\d+)?)\s*",
            value
        )
        if match:
            number = match.group(1).replace(",", ".")
            number = float(number)
            if number.is_integer():
                return int(number)
            return number
    return value


def save_json(filename, data):
    path = OUTPUT_DIR / filename
    with path.open("w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)
    print(f"Created: {path}")

def is_empty_row(values):
    return all(
        value is None or value == ""
        for value in values
    )

# =========================
# INFLUENCE
# =========================
def convert_influence(workbook):
    sheet = workbook["Среда"]
    cards = []
    for row in sheet.iter_rows(
        min_row=2,
        values_only=True
    ):
        (card_id, card_type, description, stat, value, comment) = row[:6]
        # Полностью пустые строки пропускаем
        if is_empty_row(row[:6]):
            continue
        # Без ID это не самостоятельная карточка

        if card_id is None or card_id == "":
            continue

        card = {
            "id": normalize_number(card_id),
            "type": "influence",
            "description": description,
            "effects": [
                {
                    "stat": stat,
                    "value": normalize_number(value)
                }
            ],
            "comment": comment
        }
        cards.append(card)
    return cards

# =========================
# PARENT CHOICE
# =========================
def convert_choice(workbook):
    sheet = workbook["Действие родителя"]
    cards = []
    current_card = None
    for row in sheet.iter_rows(
        min_row=2,
        values_only=True
    ):
        (card_id, card_type, description, success_type, stat, value, comment) = row[:7]

        if is_empty_row(row[:7]):
            continue
        
        # Новая карточка
        if card_id is not None and card_id != "":
            if current_card is not None:
                cards.append(current_card)
            current_card = {
                "id": normalize_number(card_id),
                "type": "choice",
                "description": description,
                "success": None,
                "failure": None
            }

        if current_card is None:
            continue

        outcome = {
            "effects": [
                {
                    "stat": stat,
                    "value": normalize_number(value)
                }
            ],
            "comment": comment
        }

        if success_type == "Удача":
            current_card["success"] = outcome
        elif success_type == "Неудача":
            current_card["failure"] = outcome

    # Последняя карточка
    if current_card is not None:
        cards.append(current_card)
    return cards

# =========================
# SITUATIONS
# =========================
def convert_situations(workbook):
    sheet = workbook["Ситуация"]
    cards = []
    current_card = None
    current_choice = None
    for row in sheet.iter_rows(
        min_row=2,
        values_only=True
    ):
        (card_id, card_type, description, action, stat, value, comment) = row[:7]
        if is_empty_row(row[:7]):
            continue

        # Новая карточка
        if card_id is not None and card_id != "":
            # Сохраняем предыдущий choice
            if (
                current_card is not None
                and current_choice is not None
            ):
                current_card["choices"].append(current_choice)

            # Сохраняем предыдущую карточку
            if current_card is not None:
                cards.append(current_card)

            current_card = {
                "id": normalize_number(card_id),
                "type": "situation",
                "description": description,
                "choices": []
            }
            current_choice = None

        if current_card is None:
            continue
 
        # -------------------------
        # NEW CHOICE
        # -------------------------
        if action is not None and action != "":
            # Сохраняем предыдущий вариант
            if current_choice is not None:
                current_card["choices"].append(
                    current_choice
                )

            current_choice = {
                "text": action,
                "effects": [],
                "comment": comment
            }

        # -------------------------
        # EFFECT
        # -------------------------
        if (
            current_choice is not None
            and stat is not None
            and stat != ""
        ):
            current_choice["effects"].append({
                "stat": stat,
                "value": normalize_number(value)
            })

        # Иногда комментарий может оказаться
        # на отдельной строке
        if (
            current_choice is not None
            and comment is not None
            and current_choice["comment"] is None
        ):
            current_choice["comment"] = comment

    # =========================
    # SAVE LAST ITEMS
    # =========================
    if (
        current_card is not None
        and current_choice is not None
    ):
        current_card["choices"].append(current_choice)

    if current_card is not None:
        cards.append(current_card)
    return cards

# =========================
# MAIN
# =========================
def main():
    print(f"Reading: {EXCEL_PATH}")

    if not EXCEL_PATH.exists():
        raise FileNotFoundError(f"Excel file not found: {EXCEL_PATH}")

    workbook = load_workbook(EXCEL_PATH, data_only=False)
    influence_cards = (convert_influence(workbook))
    choice_cards = (convert_choice(workbook))
    situation_cards = (convert_situations(workbook))

    save_json("influence.json",influence_cards)
    save_json("choice.json",choice_cards)
    save_json("situation.json",situation_cards)

    print("Conversion complete.")
    print(f"Influence cards: {len(influence_cards)}")
    print(f"Choice cards: {len(choice_cards)}")
    print(f"Situation cards: {len(situation_cards)}")


if __name__ == "__main__":
    main()