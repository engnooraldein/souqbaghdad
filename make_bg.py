import sys
from PIL import Image, ImageDraw, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display

image_path = "C:/Users/hp/.gemini/antigravity-ide/brain/b4b006a4-6bdd-4467-ad0a-ef117a4bbc9a/transport_background_no_text_1786745095857.jpg"
out_path = "public/transport-default.jpg"
font_path = "Cairo-Bold.ttf"

text1 = "يتوفر خط نقل طلاب وموظفين"
text2 = "شكراً لاختياركم سوق بغداد الرقمي"

# Reshape and apply bidi algorithm
reshaped_text1 = arabic_reshaper.reshape(text1)
bidi_text1 = get_display(reshaped_text1)

reshaped_text2 = arabic_reshaper.reshape(text2)
bidi_text2 = get_display(reshaped_text2)

# Open image
img = Image.open(image_path)
draw = ImageDraw.Draw(img)
width, height = img.size

# Load fonts
font_large = ImageFont.truetype(font_path, 60)
font_small = ImageFont.truetype(font_path, 40)

# Get bounding box for text 1
bbox1 = draw.textbbox((0, 0), bidi_text1, font=font_large)
w1 = bbox1[2] - bbox1[0]
h1 = bbox1[3] - bbox1[1]

# Get bounding box for text 2
bbox2 = draw.textbbox((0, 0), bidi_text2, font=font_small)
w2 = bbox2[2] - bbox2[0]
h2 = bbox2[3] - bbox2[1]

# Draw text centered near the bottom
y1 = height - 200
x1 = (width - w1) / 2
draw.text((x1, y1), bidi_text1, font=font_large, fill=(255, 255, 255))

y2 = height - 100
x2 = (width - w2) / 2
draw.text((x2, y2), bidi_text2, font=font_small, fill=(200, 200, 200))

img.save(out_path)
print(f"Saved {out_path}")
