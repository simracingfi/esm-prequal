.PHONY: build clean

build: export GOOS=windows
build: export GOARCH=amd64
build:
	go build -o esm-loader.exe .

clean:
	rm -f esm-loader.exe
