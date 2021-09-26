package automl;

import java.io.*;
import hex.genmodel.easy.RowData;
import hex.genmodel.easy.EasyPredictModelWrapper;
import hex.genmodel.easy.prediction.*;
import hex.genmodel.algos.deeplearning.DeeplearningMojoModel;
import hex.genmodel.MojoModel;

public class H20Parser {

  public static void main(String[] args) throws Exception {
    MojoModel mj = MojoModel.load("/Users/rohan.kothapalli/Downloads/h2o3/deeplearning_model.zip");

    System.out.println(mj.nfeatures());

    System.out.println(mj.getModelCategory());

    System.out.println(mj.nclasses());

    System.out.println(mj._responseColumn);
    
    System.out.println(mj.getPredsSize());
    
    for(int i=0;i<mj.getNames().length;i++) {
    	System.out.println(mj.getNames()[i]);
    }
    
//    for(int i=0;i<mj.features().length;i++){
//        System.out.println(mj.features()[i]);
//    }
   }
}