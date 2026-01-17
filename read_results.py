
try:
    with open("backend/results.txt", "r", encoding="utf-16") as f:
        print(f.read())
except Exception as e:
    print(e)
