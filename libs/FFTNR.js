"use strict";

// порядок данных
// time [0]          | Real [bin 0]
// time [1]          | Real [bin length/2]
// time [2]          | Real [bin 1]
// time [3]          | Imag [bin 1]
// time [...]        | Real [bin ...]
// time [...]        | Imag [bin ...]
// time [length-2]   | Real [bin length/2-1]
// time [length-1]   | Imag [bin length/2-1]

var FFTNR = {
	// для комплексной функции n-переменных
	complex: function (data, n, isign) {
		var nn = n << 1, mmax, m, j = 1, istep, i,
		wr, wpr, wpi, wi, theta, tempr, tempi, halfmmax, dj1, dj, sin = Math.sin;
		// обмен битами
		for (i = 1; i < nn; i += 2) {
			if (j > i) {
				tempr = data[j - 1];
				data[j - 1] = data[i - 1];
				data[i - 1] = tempr;
				tempr = data[j];
				data[j] = data[i];
				data[i] = tempr;
			}
			m = n;
			while (m >= 2 && j > m) {
				j -= m;
				m >>>= 1;
			}
			j += m;
		}
		// первый проход (mmax = 2 / wr = 1 / wi = 0)
		for (i = 1; i <= nn; i += 4) {
			j = i + 2;
			tempr = data[j - 1];
			tempi = data[j];
			data[j - 1] = data[i - 1] - tempr;
			data[j] = data[i] - tempi;
			data[i - 1] += tempr;
			data[i] += tempi;
		}

		mmax = 4;
		theta = isign * 6.283185307179586476925286766559 * 0.25;

		while (nn > mmax) {
			istep = mmax << 1;
			wpi = sin(theta);
			theta *= 0.5;
			wpr = sin(theta);
			wpr *= -2.0 * wpr;

			// частный случай для внутреннего цикла, когда m = 1:
			// wr = 1 / wi = 0
			for (i = 1; i <= nn; i += istep) {
				j = i + mmax;
				tempr = data[j - 1];
				tempi = data[j];
				data[j - 1] = data[i - 1] - tempr;
				data[j] = data[i] - tempi;
				data[i - 1] += tempr;
				data[i] += tempi;
			}
			wr = 1.0 + wpr;
			wi = wpi;

			halfmmax = ((mmax >>> 1) + 1);
			for (m = 3; m < halfmmax; m += 2) {
				for (i = m; i <= nn; i += istep) {
					j = i + mmax;
					tempr = (wr * (dj1 = data[j - 1])) - (wi * (dj = data[j]));
					tempi = (wr * dj) + (wi * dj1);
					data[j - 1] = data[i - 1] - tempr;
					data[j] = data[i] - tempi;
					data[i - 1] += tempr;
					data[i] += tempi;
				}
				wr += ((tempr = wr) * wpr) - (wi * wpi);
				wi += (wi * wpr) + (tempr * wpi);
			}

			// частный случай для внутреннего цикла, когда m = ((mmax >>> 1) + 1):
			// wr = 0 / wi = isign
			if (isign === 1) {
				for (i = m; i <= nn; i += istep) {
					j = i + mmax;
					tempr = -data[j];
					tempi = data[j - 1];
					data[j - 1] = data[i - 1] - tempr;
					data[j] = data[i] - tempi;
					data[i - 1] += tempr;
					data[i] += tempi;
				}
				wr = -wpi;
				wi = 1.0 + wpr;
			} else {
				for (i = m; i <= nn; i += istep) {
					j = i + mmax;
					tempr = data[j];
					tempi = -data[j - 1];
					data[j - 1] = data[i - 1] - tempr;
					data[j] = data[i] - tempi;
					data[i - 1] += tempr;
					data[i] += tempi;
				}
				wr = wpi;
				wi = -1.0 - wpr;
			}
			m += 2;

			for (; m < mmax; m += 2) {
				for (i = m; i <= nn; i += istep) {
					j = i + mmax;
					tempr = (wr * (dj1 = data[j - 1])) - (wi * (dj = data[j]));
					tempi = (wr * dj) + (wi * dj1);
					data[j - 1] = data[i - 1] - tempr;
					data[j] = data[i] - tempi;
					data[i - 1] += tempr;
					data[i] += tempi;
				}
				wr += ((tempr = wr) * wpr) - (wi * wpi);
				wi += (wi * wpr) + (tempr * wpi);
			}
			mmax = istep;
		}
		return true;
	},

	// для действительной функции
	real: function (data, n, isign) {
		var i, i1, i2, i3, i4, d1, d2, d3, d4, n4 = n >>> 2,
		c2, h1r, h1i, h2r, h2i, wr, wi, wpr, wpi, theta = 3.1415926535897932384626433832795 / (n >>> 1);
		if (isign === 1) {
			c2 = -0.5;
			FFTNR.complex(data, n >>> 1, 1);
		} else {
			c2 = 0.5;
			theta = -theta;
		}
		wpr = Math.sin(0.5 * theta);
		wr = 1.0 + (wpr *= (-2.0 * wpr));
		wi = (wpi = Math.sin(theta));
		for (i = 1; i < n4; i++) {
			i2 = 1 + (i1 = (i << 1));
			i4 = 1 + (i3 = (n - i1));
			h1r = 0.5 * ((d1 = data[i1]) + (d3 = data[i3]));
			h1i = 0.5 * ((d2 = data[i2]) - (d4 = data[i4]));
			h2r = -c2 * (d2 + d4);
			h2i = c2 * (d1 - d3);
			data[i1] = h1r + (d1 = (wr * h2r)) - (d2 = (wi * h2i));
			data[i2] = h1i + (d3 = (wr * h2i)) + (d4 = (wi * h2r));
			data[i3] = h1r - d1 + d2;
			data[i4] = d3 + d4 - h1i;
			wr += ((h1r = wr) * wpr) - (wi * wpi);
			wi += (wi * wpr) + (h1r * wpi);
		}
		if (isign === 1) {
			data[0] = (h1r = data[0]) + data[1];
			data[1] = h1r - data[1];
		} else {
			data[0] = 0.5 * ((h1r = data[0]) + data[1]);
			data[1] = 0.5 * (h1r - data[1]);
			FFTNR.complex(data, n >>> 1, -1);
			h1r = 2.0 / n;
			for (i = n - 1; i >= 0; i--)
				data[i] *= h1r;
		}
		return true;
	}
};
