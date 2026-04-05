.PHONY: build build-windows clean

build:
	go build -o esm-loader .

build-windows:
	GOOS=windows GOARCH=amd64 go build -o esm-loader.exe .

clean:
	rm -f esm-loader esm-loader.exe
