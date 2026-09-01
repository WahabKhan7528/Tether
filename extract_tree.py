from PIL import Image

def process_image(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()
    new_data = []
    
    for item in datas:
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((item[0], item[1], item[2], 0))
        else:
            new_data.append((item[0], item[1], item[2], 255))
            
    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"Processed {output_path}")

process_image(r"C:\Users\EliteBook\.gemini\antigravity-ide\brain\e83054ad-42b6-4f31-9a51-a2e0eb9aac75\tree_cherry_centered_1788039330266.jpg", "client/src/assets/tree_cherry.png")
process_image(r"C:\Users\EliteBook\.gemini\antigravity-ide\brain\e83054ad-42b6-4f31-9a51-a2e0eb9aac75\tree_lavender_centered_1788039320041.jpg", "client/src/assets/tree_lavender.png")
