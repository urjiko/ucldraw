# UEFA Draw Simulator

Vanilla HTML, CSS ve JavaScript ile hazırlanmış interaktif UEFA lig aşaması kura simülatörü.

## Yapı

- `index.html`: Sayfa iskeleti ve erişilebilirlik etiketleri
- `styles.css`: Üç turnuvanın temaları, responsive yerleşim ve animasyonlar
- `teams.js`: Turnuva ayarları, torbalar ve takım verileri
- `app.js`: Arama, seçim, kura motoru, animasyonlar ve kişisel kura modu
- `assets/`: Arka planlar ve turnuva görselleri
- `crests/`: Takım armaları

## Takımları güncelleme

Sadece `teams.js` içindeki ilgili turnuvanın `teams` dizisini düzenle:

```js
{ name: 'Team Name', country: 'TUR', pot: 1, crest: 'team-file-slug' }
```

- `name`: Ekranda görünen takım adı
- `country`: Üç harfli federasyon kodu
- `pot`: Takımın torbası
- `crest`: Opsiyonel. `crests/team-file-slug.png` dosyasını kullanır. Dosya yoksa takımın baş harfleri gösterilir.

Conference League listesi şimdilik açıkça işaretlenmiş örnek takımlardan oluşuyor.

## Uygulanan temel kurallar

### Champions League ve Europa League

- 36 takım, dört torba
- Her torbadan iki rakip
- Her torbada bir iç saha ve bir deplasman maçı
- Aynı federasyondan takım seçilemez
- Başka bir federasyondan en fazla iki rakip seçilebilir

### Conference League

- 36 takım, altı torba
- Her torbadan bir rakip
- Pot 1-2, 3-4 ve 5-6 çiftlerinin her birinde bir iç saha ve bir deplasman maçı
- Aynı federasyondan takım seçilemez
- Başka bir federasyondan en fazla iki rakip seçilebilir

Bu simülatör seçilen takımın rakiplerini üretir. UEFA'nın bütün 36 takım için aynı anda çözdüğü küresel takvim, yayın, şehir, güvenlik ve önceki sezon kısıtları bu sürümün kapsamı dışındadır.

## Yerel çalıştırma

Statik dosya sunucusu yeterlidir:

```bash
python -m http.server 8000
```

Ardından tarayıcıda `http://localhost:8000` adresini aç.
