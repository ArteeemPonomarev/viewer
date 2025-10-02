# Фрагменты для 3D вьюера

Поместите ваши .frag файлы в эту папку, и они будут доступны по адресам:

- `http://localhost:5173/fragments/your_file.frag`

## Как использовать:

### Способ 1: Через интерфейс (рекомендуется)
1. Поместите .frag файлы в папку `public/fragments/`
2. Введите имя файла в поле "Имя файла фрагмента" (например: `my_model.frag`)
3. Нажмите кнопку "📁 Загрузить"

### Способ 2: Программно
1. Обновите пути в `src/components/IFCViewer.tsx` в массиве `fragPaths`
2. Перезапустите приложение

## Доступные файлы:

- `2024-09-22 Дорохова_Топливо.ifc.frag` - модель топливной системы
- `2024-10-09 Дорохова Газоходы.ifc.frag` - модель газоходов
- `NCBC_DC_B_AR_R24.ifc.frag` - архитектурная модель
- `NCBC_DC_B_AUP_R24.ifc.frag` - модель АУП
- `NCBC_DC_B_EOM_R24_Mazur_E.ifc.frag` - модель ЭОМ
- `NCBC_DC_B_KITSO_R24.ifc.frag` - модель КИТСО
- `NCBC_DC_B_KR1_R24_DZ.ifc.frag` - модель КР1
- `NCBC_DC_B_KR2_R24.ifc.frag` - модель КР2
- `NCBC_DC_B_KR3_R24.ifc.frag` - модель КР3
- `NCBC_DC_B_OV_R24.ifc.frag` - модель ОВ
- `NCBC_DC_B_OV2.2.ifc.frag` - модель ОВ2.2
- `NCBC_DC_B_SS_R24_Mazur_E.ifc.frag` - модель СС
- `NCBC_DC_B_TS_R24.ifc.frag` - модель ТС

## Поддерживаемые форматы:

- .frag файлы (фрагменты)
- .ifc файлы (через конвертацию в фрагменты)

## Размер файлов:

Рекомендуется использовать файлы размером не более 50MB для оптимальной производительности.

## Структура папки:

```
public/fragments/
├── README.md
├── 2024-09-22 Дорохова_Топливо.ifc.frag
├── 2024-10-09 Дорохова Газоходы.ifc.frag
├── NCBC_DC_B_AR_R24.ifc.frag
├── NCBC_DC_B_AUP_R24.ifc.frag
├── NCBC_DC_B_EOM_R24_Mazur_E.ifc.frag
├── NCBC_DC_B_KITSO_R24.ifc.frag
├── NCBC_DC_B_KR1_R24_DZ.ifc.frag
├── NCBC_DC_B_KR2_R24.ifc.frag
├── NCBC_DC_B_KR3_R24.ifc.frag
├── NCBC_DC_B_OV_R24.ifc.frag
├── NCBC_DC_B_OV2.2.ifc.frag
├── NCBC_DC_B_SS_R24_Mazur_E.ifc.frag
└── NCBC_DC_B_TS_R24.ifc.frag
```
