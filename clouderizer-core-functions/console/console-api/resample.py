import pandas as pd
import json
import sys

df = pd.DataFrame(data=json.loads(sys.argv[1]), columns=["date", "output"])
df = df.set_index(['date'])
df.index = pd.to_datetime(df.index, unit='ms')
df_pred = pd.DataFrame(data=json.loads(sys.argv[2]), columns=["date1", "output1"])
df_pred = df_pred.set_index(['date1'])
df_pred.index = pd.to_datetime(df_pred.index, unit='ms')
res = (pd.Series(df_pred.index[1:]) - pd.Series(df_pred.index[:-1])).value_counts()
interval = pd.date_range(df_pred.index[0], df_pred.index[-1], freq=res.index[0])
g = df_pred.index[1] - df_pred.index[0]
h = df.index[1] - df.index[0]
if(g < h):
    interpolated = df.resample(interval.freqstr).interpolate()
else:
    interpolated = df.resample(interval.freqstr).mean()
records = json.loads(interpolated.to_json()).values()
print(json.dumps(list(records)[0]))

# datadict =  json.loads(sys.argv[1])
# df_pred = pd.DataFrame(data=json.loads(sys.argv[2]), columns=["date1", "output1"])
# df_pred = df_pred.set_index(['date1'])
# df_pred.index = pd.to_datetime(df_pred.index, unit='ms')
# datalist = []
# for i in datadict.keys():
#     df = pd.DataFrame(data=datadict[i], columns=["date", "output"])
#     df = df.set_index(['date'])
#     df.index = pd.to_datetime(df.index, unit='ms')

#     res = (pd.Series(df_pred.index[1:]) - pd.Series(df_pred.index[:-1])).value_counts()
#     interval = pd.date_range(df_pred.index[0], df_pred.index[-1], freq=res.index[0])
#     g = df_pred.index[1] - df_pred.index[0]
#     h = df.index[1] - df.index[0]
#     if(g < h):
#         interpolated = df.resample(interval.freqstr).interpolate()
#     else:
#         interpolated = df.resample(interval.freqstr).mean()
#     records = json.loads(interpolated.to_json()).values()
#     datalist.append({i: records})
# print(json.dumps(datalist))