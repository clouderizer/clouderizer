import os


def init():
    global BASE_URL
    global LOCAL_PATH
    global LOCAL_DIR
    global DOCKERFILES_LOC
    global TEMPLATES_LOC
    global LAMBDA_FUNCTION_DIR
    global S3_CLDZ_PRESIGNED_ENDPOINT

    LOCAL_PATH=os.getenv("HOME") + "/.clouderizer/creds"
    dir_name = os.path.dirname(os.path.realpath(__file__)).split("/")[-1]
    if dir_name == "clouderizer_beta" or "beta" in dir_name:
        BASE_URL="https://showcase2.clouderizer.com"
        LOCAL_PATH = os.getenv("HOME") + "/.clouderizer/beta/creds"
    else:
        BASE_URL="https://showcase.clouderizer.com"

    LOCAL_DIR=os.getenv("HOME") + "/.clouderizer"
    DOCKERFILES_LOC = LOCAL_DIR+"/dockerfiles/"
    LAMBDA_FUNCTION_DIR = LOCAL_DIR+ "/lambda-dir/function/"
    TEMPLATES_LOC = LOCAL_DIR + "/templates/"

    S3_CLDZ_PRESIGNED_ENDPOINT = BASE_URL + '/api/awsconfig/generatepresignedurl'
