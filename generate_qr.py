import qrcode

url = "https://mhanna-menu.onrender.com/"

qr = qrcode.QRCode(
    version=1,
    box_size=10,
    border=4
)
qr.add_data(url)
qr.make(fit=True)

img = qr.make_image(fill="black", back_color="white")
img.save("mhanna-menu-qr.png")
