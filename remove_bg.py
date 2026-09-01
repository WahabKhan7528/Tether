from PIL import Image
import os

def make_transparent(input_path, output_path):
    if not os.path.exists(input_path):
        print(f"File not found: {input_path}")
        return
        
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()
    
    bg_color = datas[0]
    print(f"Background color for {input_path}: {bg_color}")
    
    new_data = []
    threshold = 40
    
    for item in datas:
        if (abs(item[0] - bg_color[0]) < threshold and 
            abs(item[1] - bg_color[1]) < threshold and 
            abs(item[2] - bg_color[2]) < threshold):
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"Saved {output_path}")

make_transparent("client/src/assets/tree_cherry.jpg", "client/src/assets/tree_cherry.png")
make_transparent("client/src/assets/tree_lavender.jpg", "client/src/assets/tree_lavender.png")
