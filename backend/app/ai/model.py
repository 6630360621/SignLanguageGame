from transformers import AutoImageProcessor, SiglipForImageClassification
from PIL import Image
import torch
import base64
import io

model_name = "prithivMLmods/Alphabet-Sign-Language-Detection"
model = SiglipForImageClassification.from_pretrained(model_name)
processor = AutoImageProcessor.from_pretrained(model_name)
model.eval()

labels = {str(i): chr(65 + i) for i in range(26)}


def predict_sign(image_input):
    if isinstance(image_input, str):
        # base64 data URI (e.g. "data:image/jpeg;base64,...") or raw base64
        if "," in image_input:
            image_input = image_input.split(",", 1)[1]
        image_bytes = base64.b64decode(image_input)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    else:
        # numpy array
        image = Image.fromarray(image_input).convert("RGB")

    inputs = processor(images=image, return_tensors="pt")

    with torch.inference_mode():
        outputs = model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=1)

    predicted_index = probs.argmax().item()
    return labels[str(predicted_index)]