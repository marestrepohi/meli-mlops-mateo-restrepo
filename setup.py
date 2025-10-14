from setuptools import setup, find_packages

setup(
    name="housing-price-predictor",
    version="1.0.0",
    description="MLOps pipeline for Boston Housing price prediction",
    author="Mateo Restrepo",
    author_email= 'mateorestrepohiguita@gmail.com',
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    python_requires=">=3.9",
    install_requires=[
        line.strip()
        for line in open("requirements.txt")
        if line.strip() and not line.startswith("#")
    ],
)
