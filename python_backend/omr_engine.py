"""
=============================================================================
SMARTLJK AI - OPENCV & NUMPY COMPUTER VISION OMR ENGINE
Perspective Warping, Corner Anchor Detection, and Bubble Recognition
=============================================================================
"""

import cv2
import numpy as np
from typing import List, Tuple, Dict, Any, Optional

def order_points(pts: np.ndarray) -> np.ndarray:
    """
    Mengurutkan 4 titik koordinat sudut menjadi urutan:
    1. Top-Left (Kiri-Atas)
    2. Top-Right (Kanan-Atas)
    3. Bottom-Right (Kanan-Bawah)
    4. Bottom-Left (Kiri-Bawah)
    """
    rect = np.zeros((4, 2), dtype="float32")
    
    # Titik kiri-atas memiliki jumlah (x + y) terkecil
    # Titik kanan-bawah memiliki jumlah (x + y) terbesar
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    
    # Titik kanan-atas memiliki selisih (y - x) terkecil
    # Titik kiri-bawah memiliki selisih (y - x) terbesar
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    
    return rect

def four_point_transform(image: np.ndarray, pts: np.ndarray, target_width: int = 1000, target_height: int = 1400) -> np.ndarray:
    """
    Melakukan Perspective Transformation (Warping) untuk meluruskan lembar LJK
    berdasarkan 4 titik sudut (Anchor Markers).
    """
    rect = order_points(pts)
    
    dst = np.array([
        [0, 0],
        [target_width - 1, 0],
        [target_width - 1, target_height - 1],
        [0, target_height - 1]
    ], dtype="float32")
    
    # Hitung matriks transformasi perspektif dan terapkan warp
    matrix = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, matrix, (target_width, target_height))
    
    return warped

def detect_anchor_markers(image: np.ndarray) -> Optional[np.ndarray]:
    """
    Mendeteksi 4 kotak hitam 'Anchor Markers' di 4 sudut lembar LJK.
    Menggunakan Adaptive Thresholding dan Contour Analysis.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    thresh = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 15, 4
    )
    
    # Temukan kontur
    contours, _ = cv2.findContours(thresh, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    
    candidates = []
    h_img, w_img = gray.shape[:2]
    
    for c in contours:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.04 * peri, True)
        
        # Cari kontur dengan 4 sudut (persegi)
        if len(approx) == 4:
            x, y, w, h = cv2.boundingRect(approx)
            aspect_ratio = float(w) / h
            area = cv2.contourArea(c)
            
            # Filter rasio aspek mendekati 1:1 dan ukuran wajar marker sudut
            if 0.8 <= aspect_ratio <= 1.2 and 400 < area < (w_img * h_img * 0.05):
                M = cv2.moments(c)
                if M["m00"] != 0:
                    cX = int(M["m10"] / M["m00"])
                    cY = int(M["m01"] / M["m00"])
                    candidates.append((cX, cY))
                    
    # Jika terdeteksi minimal 4 marker, kelompokkan ke 4 kuadran
    if len(candidates) >= 4:
        # Sortir kuadran (TL, TR, BR, BL)
        candidates = sorted(candidates, key=lambda p: (p[1] // (h_img // 2), p[0] // (w_img // 2)))
        return np.array(candidates[:4], dtype="float32")
        
    return None

def analyze_bubble_density(roi: np.ndarray) -> float:
    """
    Menghitung persentase kehitaman / pengisian (Fill Rate) pada area bulatan LJK.
    Nilai 0.0 (putih bersih) hingga 1.0 (hitam pekat pensil 2B).
    """
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY) if len(roi.shape) == 3 else roi
    # Otsu thresholding
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)
    total_pixels = cv2.countNonZero(thresh)
    density = total_pixels / float(roi.shape[0] * roi.shape[1])
    return density

def evaluate_single_choice(warped_image: np.ndarray, bubble_coords: List[Tuple[int, int, int, int]]) -> str:
    """
    Evaluasi Pilihan Ganda (Single Choice: A, B, C, D, E).
    bubble_coords adalah list bounding box [(x, y, w, h)] untuk opsi [A, B, C, D, E].
    Mengembalikan opsi tergelap di atas threshold (misal 'C').
    """
    labels = ["A", "B", "C", "D", "E"]
    densities = []
    
    for (x, y, w, h) in bubble_coords:
        roi = warped_image[y:y+h, x:x+w]
        density = analyze_bubble_density(roi)
        densities.append(density)
        
    max_idx = int(np.argmax(densities))
    # Threshold minimal 0.25 untuk dianggap terisi
    if densities[max_idx] >= 0.25:
        return labels[max_idx]
    return "" # Kosong / Tidak diisi

def evaluate_multi_choice(warped_image: np.ndarray, bubble_coords: List[Tuple[int, int, int, int]]) -> List[str]:
    """
    Evaluasi Pilihan Ganda Kompleks (Multi Choice checkboxes).
    Mengembalikan daftar opsi yang dicentang/dihitamkan (misal ['A', 'C']).
    """
    labels = ["A", "B", "C", "D", "E"]
    selected = []
    
    for idx, (x, y, w, h) in enumerate(bubble_coords):
        roi = warped_image[y:y+h, x:x+w]
        density = analyze_bubble_density(roi)
        if density >= 0.28:
            selected.append(labels[idx])
            
    return selected

def evaluate_true_false(warped_image: np.ndarray, b_coord: Tuple[int, int, int, int], s_coord: Tuple[int, int, int, int]) -> str:
    """
    Evaluasi Pernyataan Benar/Salah (Opsi B vs S).
    """
    roi_b = warped_image[b_coord[1]:b_coord[1]+b_coord[3], b_coord[0]:b_coord[0]+b_coord[2]]
    roi_s = warped_image[s_coord[1]:s_coord[1]+s_coord[3], s_coord[0]:s_coord[0]+s_coord[2]]
    
    dens_b = analyze_bubble_density(roi_b)
    dens_s = analyze_bubble_density(roi_s)
    
    if dens_b > dens_s and dens_b >= 0.25:
        return "B"
    elif dens_s > dens_b and dens_s >= 0.25:
        return "S"
    return ""

def crop_handwriting_box(warped_image: np.ndarray, box_coord: Tuple[int, int, int, int]) -> np.ndarray:
    """
    Memotong (crop) area kotak tulisan tangan isian singkat untuk dikirimkan ke AI Vision OCR.
    """
    x, y, w, h = box_coord
    cropped = warped_image[y:y+h, x:x+w]
    return cropped
