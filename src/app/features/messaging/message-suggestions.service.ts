import { Injectable } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Environments } from 'src/app/environments';

@Injectable({
  providedIn: 'root',
})
export class MessageSuggestionsService {
  private genAI = new GoogleGenerativeAI(Environments.geminiApiKey);

  private model = this.genAI.getGenerativeModel({
    model: 'gemini-3.5-flash-lite',
  });

  msgThemes: any[] = [];

  // egyszerű „smart reply” minta
  async suggestReplies(message: string): Promise<string[]> {
    if (message) {
      const prompt = `Adj pontosan 5 frappáns, barátságos, vagy szerelmes, de pontos válaszjavaslatot erre az üzenetre: ${message}. Eloszor figyeld meg hogy az uzenet milyen nyelven van, es annak megfeleloen valaszolj ugyanazon a nyelven.
      Ha az uzenet tartalmaz emojit vagy hangulatjelet, akkor a valasz javaslatok is tartalmazzanak emojit vagy hangulatjelet az uzenethez igazitva. Ha az uzenet szerelmes hangvételű, akkor az 5 válaszjavaslatbol 2 legyen perverz, szexualis, vagy flortolos hangvételű.
      Csak a válaszokat add vissza, soronként egyet. Ne írj bevezetőt, ne írj magyarázatot, csak az 5 válaszjavaslatot, semmi mást.
      `;
      const result = await this.model.generateContent(prompt);
      const text = result.response.text().trim();
      // egyszerű parse: sorokra vágjuk
      return text
        .split('\n')
        .map(l => l.replace(/^[-*\d\.\s]+/, '').trim())
        .filter(Boolean)
        .slice(0, 5);
    } else return ['Sajnos nem tudok mediatartalmat ertelmezni.'];
  }

  getMsgThemes() {
    return (this.msgThemes = [
      {
        url: 'https://img.freepik.com/free-photo/vertical-aerial-shot-clouds-forest_181624-2570.jpg?t=st=1737474214~exp=1737477814~hmac=4158899e6efa97dd6b0375e282a4bd26bc8d93963af25adc5d6c99045c55fbfd&w=740',
        name: 'Ködös erdő',
      },
      {
        url: 'https://img.freepik.com/free-photo/vertical-shot-foamy-waves-coming-sandy-beach-beautiful-blue-sky_181624-7667.jpg?t=st=1737559170~exp=1737562770~hmac=6dca86ff5daf4ed0334d1b136c9bd1a77c2b694a46a5e2517e4fcbc7b5f9a224&w=740',
        name: 'Tenger',
      },
      {
        url: 'https://img.freepik.com/free-photo/space-background-realistic-starry-night-cosmos-shining-stars-milky-way-stardust-color-galaxy_1258-153810.jpg?t=st=1737559315~exp=1737562915~hmac=a5cfda45d16dd929913dc8ff0bfe64531f02d030f9b2cc4585c9136b4d9ad79d&w=1380',
        name: 'Univerzum',
      },
      {
        url: 'https://img.freepik.com/free-photo/relationship-concept-with-red-heart-wooden-cubes-wooden-table-side-view_176474-9500.jpg?t=st=1737470112~exp=1737473712~hmac=a0bf5168982ead3ad2f319c2254a3f4850d964ad84d2125554b398e3085a44b3&w=1380',
        name: 'Szerelem-1',
      },
      {
        url: 'https://img.freepik.com/free-photo/beautiful-valentine-s-day-concept_23-2148741360.jpg?t=st=1737559646~exp=1737563246~hmac=71e96b06ad033c86d1a836c2b391390701fb33bd112b50bc0a63a5cf7840228f&w=740',
        name: 'Szerelem-2',
      },
      {
        url: 'https://img.freepik.com/free-photo/heart-magenta-crystals_23-2147749434.jpg?t=st=1737559714~exp=1737563314~hmac=50206fc0f0e82c12078764a8b6c0b3a5df3fdbccb58b79de8b39d8cbc972cb35&w=1060',
        name: 'Szerelem-3',
      },
      {
        url: 'https://img.freepik.com/free-photo/view-heart-shaped-balloon-floating-city_23-2150824974.jpg?t=st=1737559490~exp=1737563090~hmac=ddfb55ead379c288d474548bd26a91cca589ddf5c98b504c237fae817dc293ee&w=740',
        name: 'Szív',
      },
      {
        url: 'https://img.freepik.com/free-photo/spring-scene-with-flowers-butterfly_23-2150169999.jpg?t=st=1737474310~exp=1737477910~hmac=158e26aad913c04857b1e0b50e8c2beb8fa6136aa500b38c604f322cc006169a&w=740',
        name: 'Pipacs',
      },
      {
        url: 'https://img.freepik.com/free-photo/brown-gray-rocky-mountain-white-cloudy-sky-daytime_414077-83.jpg?t=st=1737474528~exp=1737478128~hmac=a0d533ca97898e5a7845fb1aab4f7a9d5e8e35de8efa3becbb4dfc735e133083&w=740',
        name: 'Hegy',
      },
      {
        url: 'https://img.freepik.com/free-photo/young-sports-lady-beach-make-meditation-exercises_171337-14858.jpg?t=st=1737558666~exp=1737562266~hmac=8eff30a19b1bceeff18f04258ace0940ec5780facaa6399a8e6fcf299ff4e55d&w=1380',
        name: 'Meditáció',
      },
    ]);
  }
}
