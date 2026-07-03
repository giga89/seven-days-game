from PIL import Image
import sys
import glob

def make_transparent(image_path):
    img = Image.open(image_path)
    img = img.convert("RGBA")
    data = img.getdata()
    
    # Get the background color from the top-left corner
    bg_color = data[0]
    
    new_data = []
    # Tolerance for similar colors (useful for jpeg artifacts, but shouldn't be an issue for clean pixel art)
    tolerance = 10 
    for item in data:
        if abs(item[0] - bg_color[0]) < tolerance and abs(item[1] - bg_color[1]) < tolerance and abs(item[2] - bg_color[2]) < tolerance:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(image_path, "PNG")

files = glob.glob("public/img/protagonist*.png") + glob.glob("public/img/partner_*.png") + glob.glob("public/img/child_*.png")
for f in files:
    try:
        make_transparent(f)
        print(f"Processed {f}")
    except Exception as e:
        print(f"Error on {f}: {e}")
