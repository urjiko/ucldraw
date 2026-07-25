# UEFA Draw Simulator

Vanilla HTML, CSS ve JavaScript ile hazırlanmış interaktif UEFA lig aşaması kura simülatörü.

## Yapı

- `index.html`: Sayfa iskeleti ve erişilebilirlik etiketleri
- `styles.css`: Üç turnuvanın temaları, responsive yerleşim ve ana animasyonlar
- `fixes.css`: Arama katmanı ve kura geçişleri için etkileşim düzeltmeleri
- `teams.js`: Turnuva ayarları, torbalar ve takım verileri
- `draw-engine.js`: Bütün takımlar için karşılıklı ve kurallı kura tablosunu üretir
- `app.js`: Arama, takım seçimi, kura sunumu, takım sonuçları arasında geçiş ve kişisel kura modu
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

Bütün torbalarda eşit sayıda takım bulunmalıdır. Conference League listesi şimdilik açıkça işaretlenmiş örnek takımlardan oluşuyor.

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

Kura motoru yalnız seçilen takım için bağımsız rakipler üretmez. Turnuvadaki bütün takımlar için karşılıklı tek bir kura tablosu oluşturur. Kura tamamlandıktan sonra torbalardaki başka bir takıma basarak o takımın sonucuna geçilebilir.

UEFA'nın yayın planı, şehir ve stadyum çakışmaları, güvenlik kararları, maç tarihleri ve önceki sezon takvim kısıtları bu sürümün kapsamı dışındadır.

## Yerel çalıştırma

Statik dosya sunucusu yeterlidir:

```bash
python -m http.server 8000
```

Ardından tarayıcıda `http://localhost:8000` adresini aç.
