with open('src/App.tsx', 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace("phone === '07712345678' ? 'owner' : 'user'", "phone === '07701109692' ? 'owner' : 'user'")
with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
