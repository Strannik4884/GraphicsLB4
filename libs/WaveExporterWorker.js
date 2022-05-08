"use strict";

// функция для перевода UInt32 в массив
function uint32ToArray(array, startIndex, value) {
	array[startIndex] = value;
	array[startIndex + 1] = (value >>> 8);
	array[startIndex + 2] = (value >>> 16);
	array[startIndex + 3] = (value >>> 24);
}

// функция для перевода UInt16 в массив
function uint16ToArray(array, startIndex, value) {
	array[startIndex] = value;
	array[startIndex + 1] = (value >>> 8);
}

// функция эккспорта
onmessage = function (e) {
	// инициализация переменных
	var i, d, s, hdrData, dstData, blockAlign, byteLength,
		left = new Float32Array(e.data.left),
		right = e.data.right,
		length = e.data.length, channelCount;
	// проверка канала
	if (right) {
		channelCount = 2;
		right = new Float32Array(right);
		dstData = new Uint8Array(length << 2);
		for (i = length - 1, d = i << 2; i >= 0; i--, d -= 4) {
			// чередуем левый и правый каналы перед сохранением в wave-файл
			// преобразуем данные
			s = (left[i] * 0x7FFF) | 0;
			if (s > 0x7FFF) s = 0x7FFF;
			else if (s < -0x8000) s = -0x8000;
			uint16ToArray(dstData, d, s);

			s = (right[i] * 0x7FFF) | 0;
			if (s > 0x7FFF) s = 0x7FFF;
			else if (s < -0x8000) s = -0x8000;
			uint16ToArray(dstData, d + 2, s);
		}
	} else {
		channelCount = 1;
		dstData = new Uint8Array(length << 1);
		for (i = length - 1, d = i << 1; i >= 0; i--, d -= 2) {
			// преобразуем данные
			s = (left[i] * 0x7FFF) | 0;
			if (s > 0x7FFF) s = 0x7FFF;
			else if (s < -0x8000) s = -0x8000;
			uint16ToArray(dstData, d, s);
		}
	}
	// генерируем заголовок wave-файла
	blockAlign = channelCount << 1; // 2 байта на канал
	byteLength = length * blockAlign;
	hdrData = new Uint8Array(44);
	uint32ToArray(hdrData, 0, 0x46464952); // "RIFF"
	uint32ToArray(hdrData, 4, byteLength + 36); // размер чанка
	uint32ToArray(hdrData, 8, 0x45564157); // "WAVE"
	uint32ToArray(hdrData, 12, 0x20746d66); // флаг формата
	uint32ToArray(hdrData, 16, 16); // размер заголовка PCM
	uint16ToArray(hdrData, 20, 1); // аудио формат (PCM = 1)
	uint16ToArray(hdrData, 22, channelCount);
	uint32ToArray(hdrData, 24, e.data.sampleRate);
	uint32ToArray(hdrData, 28, e.data.sampleRate * blockAlign);
	uint16ToArray(hdrData, 32, blockAlign);
	uint16ToArray(hdrData, 34, 16); // количество бит на сэмпл
	uint32ToArray(hdrData, 36, 0x61746164);
	uint32ToArray(hdrData, 40, byteLength);
	postMessage([hdrData.buffer, dstData.buffer], [hdrData.buffer, dstData.buffer]);
	return true;
};
