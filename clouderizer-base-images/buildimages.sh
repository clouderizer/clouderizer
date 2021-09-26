echo "--------Building clouderizer images----------"
echo "Building standard java cpu image"
cp -R services/node-service/* templates/cldz_python3java11/node-service
cp -R services/python-service/* templates/cldz_python3java11/python-service
docker build -t clouderizer/cldz_baseimage:p3.8-java11-node12 templates/cldz_python3java11/.
echo "Built standard java cpu image"

echo "Building standard java gpu image"
cp -R services/node-service/* templates/cldz_python3java11_gpu/node-service
cp -R services/python-service/* templates/cldz_python3java11_gpu/python-service
docker build -t clouderizer/cldz_baseimage:p3.8-java11-node12-gpu templates/cldz_python3java11_gpu/.
echo "Built standard java gpu image"

echo "Building java tensorflow cpu image"
cp -R services/node-service/* templates/cldz_tfpython3java11/node-service
cp -R services/python-service/* templates/cldz_tfpython3java11/python-service
docker build -t clouderizer/cldz_baseimage:p3.8-java11-node12-tf templates/cldz_tfpython3java11/.
echo "Built java tensorflow cpu image"

echo "Building java tensorflow gpu image"
cp -R services/node-service/* templates/cldz_tfpython3java11_gpu/node-service
cp -R services/python-service/* templates/cldz_tfpython3java11_gpu/python-service
docker build -t clouderizer/cldz_baseimage:p3.8-java11-node12-tf-gpu templates/cldz_tfpython3java11_gpu/.
echo "Built java tensorflow gpu image"

echo "Building java torch cpu image"
cp -R services/node-service/* templates/cldz_torchpython3java11/node-service
cp -R services/python-service/* templates/cldz_torchpython3java11/python-service
docker build -t clouderizer/cldz_baseimage:p3.8-java11-node12-torch templates/cldz_torchpython3java11/.
echo "Built java torch cpu image"

echo "Building java torch gpu image"
cp -R services/node-service/* templates/cldz_torchpython3_gpu/node-service
cp -R services/python-service/* templates/cldz_torchpython3_gpu/python-service
docker build -t clouderizer/cldz_baseimage:p3.8-java11-node12-torch-gpu templates/cldz_torchpython3java11_gpu/.
echo "Built java torch gpu image"

echo "Building standard python cpu image"
cp -R services/node-service/* templates/cldz_python3/node-service
cp -R services/python-service/* templates/cldz_python3/python-service
docker build -t clouderizer/cldz_baseimage:p3.8-node12 templates/cldz_python3/.
echo "Built standard python cpu image"

echo "Building standard python gpu image"
cp -R services/node-service/* templates/cldz_python3_gpu/node-service
cp -R services/python-service/* templates/cldz_python3_gpu/python-service
docker build -t clouderizer/cldz_baseimage:p3.8-node12-gpu templates/cldz_python3_gpu/.
echo "Built standard python gpu image"

echo "Building python tensorflow cpu image"
cp -R services/node-service/* templates/cldz_tfpython3/node-service
cp -R services/python-service/* templates/cldz_tfpython3/python-service
docker build -t clouderizer/cldz_baseimage:p3.8-node12-tf templates/cldz_tfpython3/.
echo "Built python tensorflow cpu image"

echo "Building python tensorflow gpu image"
cp -R services/node-service/* templates/cldz_tfpython3_gpu/node-service
cp -R services/python-service/* templates/cldz_tfpython3_gpu/python-service
docker build -t clouderizer/cldz_baseimage:p3.8-node12-tf-gpu templates/cldz_tfpython3_gpu/.
echo "Built python tensorflow gpu image"

echo "Building python torch cpu image"
cp -R services/node-service/* templates/cldz_torchpython3/node-service
cp -R services/python-service/* templates/cldz_torchpython3/python-service
docker build -t clouderizer/cldz_baseimage:p3.8-node12-torch templates/cldz_torchpython3/.
echo "Built python torch cpu image"

echo "Building python torch gpu image"
cp -R services/node-service/* templates/cldz_torchpython3_gpu/node-service
cp -R services/python-service/* templates/cldz_torchpython3_gpu/python-service
docker build -t clouderizer/cldz_baseimage:p3.8-node12-torch-gpu templates/cldz_torchpython3_gpu/.
echo "Built python torch gpu image"

echo "Building java lambda image"
cp -R services/node-service/* templates/lambda-java/node-service
cp -R services/python-service/* templates/lambda-java/python-service
docker build -t clouderizer/cldz-lambda-java-baseimage:test templates/lambda-java/.
echo "Built java lambda image"

echo "Building python lambda image"
cp -R services/node-service/* templates/lambda-python/node-service
cp -R services/python-service/* templates/lambda-python/python-service
docker build -t clouderizer/cldz-lambda-python-baseimage:test templates/lambda-python/.
echo "Built python lambda image"




echo "--------Building clouderizer hotstart images----------"

echo "Building standard java cpu hotstart image"
docker build -t clouderizer/cldz_baseimage:hotstart-python3-java11 hotstart-templates/. --build-arg TAG=p3.8-java11-node12 --build-arg BASE_URL="https//showcase1.clouderizer.com"
echo "Built standard java cpu hotstart image"

echo "Building standard java gpu hotstart image"
docker build -t clouderizer/cldz_baseimage:hotstart-python3-java11-gpu hotstart-templates/. --build-arg TAG=p3.8-java11-node12-gpu --build-arg BASE_URL="https//showcase1.clouderizer.com"
echo "Built standard java gpu hotstart image"

echo "Building java tensorflow cpu hotstart image"
docker build -t clouderizer/cldz_baseimage:hotstart-tfpython3-java11 hotstart-templates/. --build-arg TAG=p3.8-java11-node12-tf --build-arg BASE_URL="https//showcase1.clouderizer.com"
echo "Built java tensorflow cpu hotstart image"

echo "Building java tensorflow gpu hotstart image"
docker build -t clouderizer/cldz_baseimage:hotstart-tfpython3-java11-gpu hotstart-templates/. --build-arg TAG=p3.8-java11-node12-tf-gpu --build-arg BASE_URL="https//showcase1.clouderizer.com"
echo "Built java tensorflow gpu hotstart image"

echo "Building java torch cpu hotstart image"
docker build -t clouderizer/cldz_baseimage:hotstart-torchpython3-java11 hotstart-templates/. --build-arg TAG=p3.8-java11-node12-torch --build-arg BASE_URL="https//showcase1.clouderizer.com"
echo "Built java torch cpu hotstart image"

echo "Building java torch gpu hotstart image"
docker build -t clouderizer/cldz_baseimage:hotstart-torchpython3-java11-gpu hotstart-templates/. --build-arg TAG=p3.8-java11-node12-torch-gpu --build-arg BASE_URL="https//showcase1.clouderizer.com"
echo "Built java torch gpu hotstart image"

echo "Building standard python cpu hotstart image"
docker build -t clouderizer/cldz_baseimage:hotstart-python3 hotstart-templates/. --build-arg TAG=p3.8-node12 --build-arg BASE_URL="https//showcase1.clouderizer.com"
echo "Built standard python cpu hotstart image"

echo "Building standard python gpu hotstart image"
docker build -t clouderizer/cldz_baseimage:hotstart-python3-gpu hotstart-templates/. --build-arg TAG=p3.8-node12-gpu --build-arg BASE_URL="https//showcase1.clouderizer.com"
echo "Built standard python gpu hotstart image"

echo "Building python tensorflow cpu hotstart image"
docker build -t clouderizer/cldz_baseimage:hotstart-tfpython3 hotstart-templates/. --build-arg TAG=p3.8-node12-tf --build-arg BASE_URL="https//showcase1.clouderizer.com"
echo "Built python tensorflow cpu hotstart image"

echo "Building python tensorflow gpu hotstart image"
docker build -t clouderizer/cldz_baseimage:hotstart-tfpython3-gpu hotstart-templates/. --build-arg TAG=p3.8-node12-tf-gpu --build-arg BASE_URL="https//showcase1.clouderizer.com"
echo "Built python tensorflow gpu hotstart image"

echo "Building python torch cpu hotstart image"
docker build -t clouderizer/cldz_baseimage:hotstart-torchpython3 hotstart-templates/. --build-arg TAG=p3.8-node12-torch --build-arg BASE_URL="https//showcase1.clouderizer.com"
echo "Built python torch cpu hotstart image"

echo "Building python torch gpu hotstart image"
docker build -t clouderizer/cldz_baseimage:hotstart-torchpython3-gpu hotstart-templates/. --build-arg TAG=p3.8-node12-torch-gpu --build-arg BASE_URL="https//showcase1.clouderizer.com"
echo "Built python torch gpu hotstart image"
