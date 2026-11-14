# Catalogue Complet : Vesta/Moon/Mars Trek WMTS (NASA)

Ce document rassemble l'intégralité des API, services de tuiles cartographiques Web (WMTS), descriptions et spécifications techniques pour **Mars**, **Vesta** et la **Lune** issus du portail NASA API.

---

## 1. Présentation Générale du Service Trek WMTS

* **Portails officiels :** [Mars Trek](https://trek.nasa.gov/mars/) | [Vesta Trek](https://trek.nasa.gov/vesta/) | [Moon Trek](https://trek.nasa.gov/moon/)
* **Documentation technique :** [NASA Trek API Documentation](https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=moon)
* **Description & Utilité :** Ces API alimentent les portails d'exploration planétaire de la NASA (développés par le *NASA SSERVI* et l'équipe *JPL Trek*). Elles fournissent des fonds de carte haute résolution, des modèles numériques d'élévation (DEM) et des mosaïques d'imagerie exploitables directement dans des clients SIG ou applications web compatibles **OGC RESTful WMTS**.

---

## 2. Mosaïques et API disponibles pour Mars (22 ensembles)

Ces services couvrent les principaux sites d'atterrissage des rovers, les données altimétriques (MOLA) et les observations orbitales (HiRISE, CTX, HRSC, Viking, THEMIS, MOC, TES).

| Nom de la Mosaïque (Mars) | Mission / Instrument | Utilité & Contenu | Endpoint / Référence WMTS |
| :--- | :--- | :--- | :--- |
| **Viking Color Mosaic - Global Map** | Viking Orbiter | Carte globale en couleurs de la surface martienne. | `https://trek.nasa.gov/tiles/Mars/EQ/Viking_Color_Mosaic_Global_925m/1.0.0/WMTSCapabilities.xml` |
| **CTX Mosaic - Curiosity Landing Site** | MRO (Context Camera) | Imagerie contextuelle haute résolution du cratère Gale (site de Curiosity). | `https://trek.nasa.gov/tiles/Mars/EQ/CTX_Mosaic_Curiosity_Landing_Site/1.0.0/WMTSCapabilities.xml` |
| **HIRISE Mosaic - Curiosity Landing Site** | MRO (HiRISE) | Imagerie très haute résolution (jusqu'à 25 cm/pixel) du site d'atterrissage de Curiosity. | `https://trek.nasa.gov/tiles/Mars/EQ/HiRISE_Mosaic_Curiosity_Landing_Site/1.0.0/WMTSCapabilities.xml` |
| **HIRISE Mosaic - ESP_040776_2115** | MRO (HiRISE) | Observation ciblée haute résolution d'une zone géologique spécifique. | `https://trek.nasa.gov/tiles/Mars/EQ/ESP_040776_2115/1.0.0/WMTSCapabilities.xml` |
| **HiRISE Mosaic - ESP_042252_1930_RED_B_01_ORTHO** | MRO (HiRISE) | Orthophotographie dans le canal rouge pour l'analyse topographique fine. | `https://trek.nasa.gov/tiles/Mars/EQ/ESP_042252_1930_RED_B_01_ORTHO/1.0.0/WMTSCapabilities.xml` |
| **HiRISE Mosaic - ESP_042647_1760_RED_B_01_ORTHO** | MRO (HiRISE) | Orthophotographie haute précision d'une formation de surface martienne. | `https://trek.nasa.gov/tiles/Mars/EQ/ESP_042647_1760_RED_B_01_ORTHO/1.0.0/WMTSCapabilities.xml` |
| **HRSC Mosaic - Martian East** | Mars Express (HRSC) | Mosaïque stéréo haute résolution de l'hémisphère est de Mars. | `https://trek.nasa.gov/tiles/Mars/EQ/HRSC_Mosaic_Martian_East/1.0.0/WMTSCapabilities.xml` |
| **HRSC Color Mosaic - MC11** | Mars Express (HRSC) | Cartographie en couleurs du quadrangle MC-11 (Oxia Palus). | `https://trek.nasa.gov/tiles/Mars/EQ/HRSC_Color_Mosaic_MC11/1.0.0/WMTSCapabilities.xml` |
| **HRSC Mosaic - MC11** | Mars Express (HRSC) | Cartographie panchromatique détaillée du quadrangle MC-11. | `https://trek.nasa.gov/tiles/Mars/EQ/HRSC_Mosaic_MC11/1.0.0/WMTSCapabilities.xml` |
| **HIRISE Mosaic - Spirit Landing Site** | MRO (HiRISE) | Vue détaillée du cratère Gusev, site d'exploration du rover Spirit. | `https://trek.nasa.gov/tiles/Mars/EQ/HiRISE_Mosaic_Spirit_Landing_Site/1.0.0/WMTSCapabilities.xml` |
| **Mosaic Opportunity Landing Site HIRISE** | MRO (HiRISE) | Imagerie haute résolution de Meridiani Planum (site du rover Opportunity). | `https://trek.nasa.gov/tiles/Mars/EQ/HiRISE_Mosaic_Opportunity_Landing_Site/1.0.0/WMTSCapabilities.xml` |
| **HiRISE Mosaic - Phoenix Landing Site** | MRO (HiRISE) | Cartographie de Vastitas Borealis (région polaire nord, atterrisseur Phoenix). | `https://trek.nasa.gov/tiles/Mars/EQ/HiRISE_Mosaic_Phoenix_Landing_Site/1.0.0/WMTSCapabilities.xml` |
| **HiRISE Mosaic - Sojourner Landing Site** | MRO (HiRISE) | Imagerie d'Ares Vallis (site de la mission Mars Pathfinder / Sojourner). | `https://trek.nasa.gov/tiles/Mars/EQ/HiRISE_Mosaic_Sojourner_Landing_Site/1.0.0/WMTSCapabilities.xml` |
| **Albedo Mosaic - Thermal Emission Spectrometer** | Mars Global Surveyor (TES) | Mesure de la réflectivité (albédo) thermique globale de la surface. | `https://trek.nasa.gov/tiles/Mars/EQ/TES_Albedo_Mosaic/1.0.0/WMTSCapabilities.xml` |
| **DEM Grayscale Mars Orbiter Laser Altimeter** | MGS (MOLA) | Modèle numérique d'élévation (altimétrie laser) en niveaux de gris. | `https://trek.nasa.gov/tiles/Mars/EQ/MOLA_DEM_Grayscale/1.0.0/WMTSCapabilities.xml` |
| **Color Hillshade Mars Orbiter Laser Altimeter** | MGS (MOLA) | Carte topographique ombrée en fausses couleurs montrant les reliefs. | `https://trek.nasa.gov/tiles/Mars/EQ/MOLA_Color_Hillshade/1.0.0/WMTSCapabilities.xml` |
| **Experience Curiosity - Curiosity Landing Site** | MRO / MSL | Jeu de données optimisé pour la visualisation 3D interactive du cratère Gale. | `https://trek.nasa.gov/tiles/Mars/EQ/Experience_Curiosity/1.0.0/WMTSCapabilities.xml` |
| **Atlas Mosaic - Mars Orbiter Camera** | MGS (MOC) | Atlas photographique global de Mars issu de la caméra grand-angle MOC. | `https://trek.nasa.gov/tiles/Mars/EQ/MOC_Atlas_Mosaic/1.0.0/WMTSCapabilities.xml` |
| **Infrared Night - Thermal Emission Imaging System** | Mars Odyssey (THEMIS) | Imagerie infrarouge nocturne révélant l'inertie thermique des roches et poussières. | `https://trek.nasa.gov/tiles/Mars/EQ/THEMIS_IR_Night/1.0.0/WMTSCapabilities.xml` |
| **Infrared Day - Thermal Emission Imaging System** | Mars Odyssey (THEMIS) | Imagerie infrarouge diurne mettant en évidence la morphologie de surface. | `https://trek.nasa.gov/tiles/Mars/EQ/THEMIS_IR_Day/1.0.0/WMTSCapabilities.xml` |
| **HRSC Mosaic - Mawrth Vallis** | Mars Express (HRSC) | Cartographie détaillée de la vallée riche en argiles de Mawrth Vallis. | `https://trek.nasa.gov/tiles/Mars/EQ/HRSC_Mosaic_Mawrth_Vallis/1.0.0/WMTSCapabilities.xml` |
| **HRSC Color Mosaic - Mawrth Vallis** | Mars Express (HRSC) | Vue en couleurs de Mawrth Vallis pour l'étude minéralogique et géologique. | `https://trek.nasa.gov/tiles/Mars/EQ/HRSC_Color_Mosaic_Mawrth_Vallis/1.0.0/WMTSCapabilities.xml` |

---

## 3. Mosaïques et API disponibles pour Vesta (7 ensembles)

Données topographiques, géologiques et d'imagerie issues de la mission spatiale **Dawn** autour de l'astéroïde géant Vesta.

| Nom de la Mosaïque (Vesta) | Mission / Instrument | Utilité & Contenu | Endpoint / Référence WMTS |
| :--- | :--- | :--- | :--- |
| **global_LAMO** | Dawn (Framing Camera) | Mosaïque globale prise depuis l'orbite basse (Low Altitude Mapping Orbit). | `https://trek.nasa.gov/tiles/Vesta/EQ/global_LAMO/1.0.0/WMTSCapabilities.xml` |
| **Vesta_Dawn_HAMO_DTM_DLR_Global_48ppd 8Bit** | Dawn (HAMO / DLR) | Modèle numérique de terrain (DTM) global de Vesta encodé en 8 bits (48 pixels/degré). | `https://trek.nasa.gov/tiles/Vesta/EQ/Vesta_Dawn_HAMO_DTM_DLR_Global_48ppd_8Bit/1.0.0/WMTSCapabilities.xml` |
| **Vesta_Dawn_Geology_Global_32ppd_IAU** | Dawn / UAI | Carte géologique globale officielle de Vesta (unités stratigraphiques et cratères). | `https://trek.nasa.gov/tiles/Vesta/EQ/Vesta_Dawn_Geology_Global_32ppd_IAU/1.0.0/WMTSCapabilities.xml` |
| **Vesta_Dawn_HAMO_ClrShade_DLR_Global_48ppd_IAU** | Dawn (HAMO / DLR) | Carte topographique ombrée en couleurs de l'ensemble de l'astéroïde. | `https://trek.nasa.gov/tiles/Vesta/EQ/Vesta_Dawn_HAMO_ClrShade_DLR_Global_48ppd_IAU/1.0.0/WMTSCapabilities.xml` |
| **Vesta_Dawn_HAMO_MinRatio_DLR_global_74ppd_IAU** | Dawn (HAMO / DLR) | Carte des ratios minéralogiques (composition de surface à 74 pixels/degré). | `https://trek.nasa.gov/tiles/Vesta/EQ/Vesta_Dawn_HAMO_MinRatio_DLR_global_74ppd_IAU/1.0.0/WMTSCapabilities.xml` |
| **Vesta_Dawn_HAMO_Shade_DLR_Global_48ppd_IAU** | Dawn (HAMO / DLR) | Relief ombré monochrome (Hillshade) pour l'analyse des structures d'impact. | `https://trek.nasa.gov/tiles/Vesta/EQ/Vesta_Dawn_HAMO_Shade_DLR_Global_48ppd_IAU/1.0.0/WMTSCapabilities.xml` |
| **Vesta_Dawn_HAMO_TrueClr_DLR_global_74ppd** | Dawn (HAMO / DLR) | Mosaïque globale en couleurs naturelles de Vesta haute résolution. | `https://trek.nasa.gov/tiles/Vesta/EQ/Vesta_Dawn_HAMO_TrueClr_DLR_global_74ppd/1.0.0/WMTSCapabilities.xml` |

---

## 4. Spécifications et Mosaïques pour la Lune (Moon)

Le service **Moon Trek WMTS** fournit des projections **équirectangulaires (`EQ`)**, ainsi que des projections **polaires nord (`NP`)** et **polaires sud (`SP`)** pour l'exploration lunaire.

* **Modèle de base WMTS (LRO WAC Global Mosaic) :**
  * **Utilité :** Permet de charger dynamiquement les tuiles de la carte globale de la Lune capturée par la caméra grand-angle (*Wide Angle Camera*) de la sonde **Lunar Reconnaissance Orbiter (LRO)** à une résolution de 303 pixels par degré (~100 m/pixel), selon le niveau de zoom (`{z}`), la ligne (`{y}`) et la colonne (`{x}`).
  * **Structure de l'URL de tuile :**
    `https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm/{z}/{y}/{x}.jpg`
  * **Exemple d'appel direct (Niveau 0) :**
    `https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm/0/0/0.jpg`
  * **Fichier de capacités XML (WMTS Capabilities) :**
    `https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/WMTSCapabilities.xml`

---

## 5. Guide rapide d'utilisation des URLs WMTS

1. **Récupérer les métadonnées (`WMTSCapabilities.xml`) :** Utilisez les liens `.xml` dans un logiciel SIG (QGIS, ArcGIS) ou une bibliothèque web (Leaflet, OpenLayers, CesiumJS) pour charger automatiquement les couches, projections et niveaux de zoom disponibles.
2. **Requêter une tuile directement :** Remplacez `{z}/{y}/{x}` dans le modèle d'URL par les coordonnées de la tuile souhaitée. Aucune clé API (`api_key`) n'est requise pour accéder aux tuiles publiques de **Trek WMTS**.