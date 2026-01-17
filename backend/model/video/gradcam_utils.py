import cv2
import numpy as np
import torch

def generate_gradcam(model, face_tensor, original_face, target_layer):
    """
    Generates a GradCAM heatmap overlaid on the original face crop.
    """
    model.eval()
    
    # 1. Forward pass to get activations
    # Note: We pass a dummy frequency tensor as well
    dummy_freq = torch.zeros((1, 1024)).to(face_tensor.device)
    
    # We need to register hooks to capture gradients and activations
    gradients = []
    activations = []

    def save_gradient(grad):
        gradients.append(grad)

    def save_activation(module, input, output):
        activations.append(output)

    # Register hooks on the target layer (last convolutional layer of the backbone)
    # Assuming target_layer is a nn.Sequential equivalent, we might need to hook into the last layer of it
    # efficientnet_b4.features returns a Sequential. We want the last block.
    # We'll attach the hook to the last layer of the target_layer (features)
    handle_fwd = target_layer[-1].register_forward_hook(save_activation)
    handle_bwd = target_layer[-1].register_full_backward_hook(lambda m, i, o: save_gradient(o[0]))

    output = model(face_tensor, dummy_freq)
    
    # 2. Backward pass for gradients
    model.zero_grad()
    output.backward()
    
    # Remove hooks
    handle_fwd.remove()
    handle_bwd.remove()
    
    if not gradients or not activations:
         return original_face # Fail gracefully if hooks didn't work

    gradients = gradients[0]
    activations = activations[0].detach()
    
    # 4. Global Average Pooling of gradients
    pooled_gradients = torch.mean(gradients, dim=[0, 2, 3])
    
    # 5. Weight activations by gradients
    for i in range(activations.size(1)):
        activations[:, i, :, :] *= pooled_gradients[i]
        
    # 6. Create heatmap
    heatmap = torch.mean(activations, dim=1).squeeze()
    heatmap = np.maximum(heatmap.cpu().numpy(), 0) # ReLU
    heatmap /= np.max(heatmap) if np.max(heatmap) != 0 else 1
    
    # 7. Resize and Overlay
    heatmap = cv2.resize(heatmap, (original_face.shape[1], original_face.shape[0]))
    heatmap = np.uint8(255 * heatmap)
    heatmap_img = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)
    
    superimposed_img = cv2.addWeighted(original_face, 0.6, heatmap_img, 0.4, 0)
    return superimposed_img
