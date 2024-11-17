import os
import pandas as pd
from sklearn.model_selection import train_test_split
import warnings
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import make_classification
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_score, recall_score, f1_score
import matplotlib.pyplot as plt
from mlxtend.plotting import plot_confusion_matrix
from sklearn.tree import plot_tree
from sklearn.model_selection import cross_val_score
import seaborn as sns

warnings.filterwarnings(action="ignore")

# Assuming you have the file paths set correctly for your environment
for dirname, _, filenames in os.walk('/kaggle/input'):
    for filename in filenames:
        print(os.path.join(dirname, filename))

# Open the datasets
df = pd.read_csv("data_file.csv")

# Delete the useless columns
cols_to_drop = ['FileName','md5Hash']
df = df.drop(columns=cols_to_drop)

# Replace the value repeated: MD5HASH - DebugSize - MajorOSVersion - BitcoinAddresses - NumberOfSections - SizeOfStackReserve
columns = ["Machine", "DebugSize", "NumberOfSections", "SizeOfStackReserve","MajorOSVersion", "BitcoinAddresses"]
for col in columns:
    df[col] = df[col].astype('category')
    df[col] = df[col].cat.codes

# Delete all the duplicated rows
df.drop_duplicates(keep='last', inplace=True)

# Save the new datasets into a new CSV file
df.to_csv("df_clear.csv", index=False)

df = pd.read_csv("df_clear.csv")
print(df.head())

# Dataframe informations
df.info()

# Transform into List
X = df.iloc[:, 1:-1].values
Y = df.iloc[:,-1].values
print("The features (Machine ... Bitcoin@) : ", X)
print("Target vector (Benign) : ", Y)

# Creating a synthetic dataset for classification (in case real data is not used)
X, y = make_classification(n_samples=1000, n_features=15, n_classes=2, random_state=0)

# Split data into training and testing sets (20% testing and 80% training)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=0)

# Create a Random Forest Classifier with 100 trees
rf = RandomForestClassifier(n_estimators=100, random_state=0)

# Fit the Random Forest Classifier to the training data
rf.fit(X_train, y_train)

# Predict the classes of the testing set
y_pred = rf.predict(X_test)



# Load new data for prediction
X_new = [[1, 1, 0, 0, 6, 2, 0, 8192, 8, 0, 3, 1048576, 34112, 672, 0], 
         [3, 0, 0, 0, 6, 2, 0, 8192, 8, 0, 0, 0, 0, 672, 0]]

# Use the model to predict the classes of the new data
y_new_pred = rf.predict(X_new)
print("Predicted classes for new data:", y_new_pred)

# Print the confusion matrix and classification report
print("Confusion Matrix:")
cm = confusion_matrix(y_test, y_pred)
print(cm)

print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# Plot the confusion matrix
# Plot the confusion matrix

plt.figure(figsize=(6, 6))
sns.heatmap(cm, annot=True, fmt='d', cmap='Greens', cbar=False,
            xticklabels=['Not Malware', 'Malware'], yticklabels=['Not Malware', 'Malware'])
plt.xlabel('Predicted labels')
plt.ylabel('True labels')
plt.title('Confusion Matrix', fontsize=18)

# Set tick labels

plt.show()


# Calculate cross-validation scores for the model
scores = cross_val_score(rf, X, y, cv=5)

# Print the cross-validation scores
print("Cross-Validation Scores:", scores)
print("Mean Score:", scores.mean())

# Print the precision, recall, and F1 score
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)

# Print the accuracy of the model
accuracy = accuracy_score(y_test, y_pred)
print("Accuracy: {:.16f}".format(accuracy))
print("Precision: {:.16f}".format(precision))
print("Recall: {:.16f}".format(recall))
print("F1 Score: {:.16f}".format(f1))

# Fit the classifier to the entire data
# rf.fit(X, y)

# # Plot the first tree in the forest
# plt.figure(figsize=(32, 32))
# plot_tree(rf.estimators_[0], filled=True)
# plt.show()
