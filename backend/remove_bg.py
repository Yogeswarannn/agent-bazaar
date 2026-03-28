from PIL import Image

def remove_background(input_path, output_path, threshold=50):
    img = Image.open(input_path)
    img = img.convert("RGBA")
    datas = img.getdata()
    
    newData = []
    for item in datas:
        # if the pixel is dark enough, make it transparent
        if item[0] < threshold and item[1] < threshold and item[2] < threshold:
            newData.append((255, 255, 255, 0)) # Fully transparent
        else:
            newData.append(item)
            
    img.putdata(newData)
    img.save(output_path, "PNG")

remove_background(r"c:\Users\yeolb\agent-bazaar\frontend\public\raw_logo.jpg", r"c:\Users\yeolb\agent-bazaar\frontend\public\logo.png", threshold=45)
