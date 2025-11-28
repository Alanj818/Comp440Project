import React, { ChangeEvent, FormEvent, useState } from 'react';
import { Container, Typography, Box, Button } from "@mui/material";
import Query1SameDayTags from '../../components/phase3/Query1SameDayTags';
import Query2MostBlogsOnDate from '../../components/phase3/Query2MostBlogsOnDate';
import Query3FollowedByBoth from '../../components/phase3/Query3FollowedByBoth';
import Query5BlogsAllPositive from '../../components/phase3/Query5BlogsAllPositive';
import Query4NeverPostedBlog from '../../components/phase3/Query4NeverPostedBlog';
import Query6UsersOnlyNegativeComments from '../../components/phase3/Query6UsersOnlyNegativeComments';
import Query7UsersNoNegativeOnBlogs from '../../components/phase3/Query7UsersNoNegativeOnBlogs';
import { useNavigate } from 'react-router-dom';

export default function Phase3Page() {
    const navigate = useNavigate();

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>
                Phase 3 Queries
            </Typography>

            <Query1SameDayTags />
            <Query2MostBlogsOnDate />
            <Query3FollowedByBoth />
            <Query4NeverPostedBlog />
            <Query5BlogsAllPositive />
            <Query6UsersOnlyNegativeComments />
            <Query7UsersNoNegativeOnBlogs />

            <Box>
                <Button
                    variant="text"
                    color="secondary"
                    onClick={() => navigate('/')}
                >
                    return home
                </Button>
            </Box>

        </Container>
    );
}