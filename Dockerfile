FROM ubuntu:latest

# Instalar as dependências do Whisper JAX
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    libsndfile1-dev \
    libopenblas-dev

# Clonar o repositório do Whisper JAX
RUN git clone https://github.com/openai/whisper.git /whisper

# Compilar o Whisper JAX
WORKDIR /whisper
RUN cmake .
RUN make

# Definir o diretório de trabalho padrão
WORKDIR /app

# Copiar o executável do Whisper JAX para o diretório de trabalho padrão
RUN cp /whisper/whisper_jax /app/whisper_jax

# Definir a variável de ambiente LD_LIBRARY_PATH
ENV LD_LIBRARY_PATH=/whisper

# Comando de execução padrão
CMD ["./whisper_jax"]
