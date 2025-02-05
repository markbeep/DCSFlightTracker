package util

type Dict[K comparable, T any] map[K]T

func (d Dict[K, T]) LoadOrStore(key K, value T) T {
	if v, ok := d[key]; ok {
		return v
	}
	d[key] = value
	return value
}
