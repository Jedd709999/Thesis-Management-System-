FROM mysql:8.0

# Set environment variables
ENV MYSQL_DATABASE=thesis_db \
    MYSQL_USER=thesis_user \
    MYSQL_PASSWORD=thesis_pass \
    MYSQL_ROOT_PASSWORD=root_pass

# Copy initialization scripts
COPY ./init.sql /docker-entrypoint-initdb.d/

EXPOSE 3306